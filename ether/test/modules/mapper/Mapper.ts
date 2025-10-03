import hre from "hardhat";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
import {ZeroAddress} from "ethers";
import * as coreDeployment from "../../../ignition/core/deployment";
import * as GlobalConfig from "../../utils/GlobalConfig";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import * as IMapper from "./interfaces/IMapper";
import {Mapper, MapperTest} from "../../../typechain-types";

chai.use(chaiAsPromised);

describe("Mapper", function () {

  let IS_LOCALHOST = true;
  let MapperContract: any;
  let MapperFactory: any;
  let initializeMapperContract: any;
  let Token0: any;
  let Token1: any;
  let Token2: any;
  let Token3: any;
  let Token4: any;
  let newMapInfo: IMapper.MapInfo;

  let deployer: SignerWithAddress;
  let user0: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;

  const MAP_ID_1 = 1;
  const MAP_ID_2 = 2;
  const MAP_ID_3 = 3;

  const failMapId = 11111;

  beforeEach(async function () {
    const accounts = await hre.ethers.getSigners();

    deployer = accounts[0];
    user0 = accounts[1];
    user1 = accounts[2];
    user2 = accounts[3];
    user3 = accounts[4];
    user4 = accounts[4];

    Token0 = await deployExampleToken();
    Token1 = await deployExampleToken();
    Token2 = await deployExampleToken();
    Token3 = await deployExampleToken();
    Token4 = await deployExampleToken();

    const {contract, contractFactory, initialize} = await coreDeployment.deployUUPSProxy(
        IS_LOCALHOST,
        GlobalConfig.MAIN_UTILS_ROUTE + "mapper/" + GlobalConfig.MAPPER_CONTRACT_NAME + ".sol:" + GlobalConfig.MAPPER_CONTRACT_NAME,
        deployer,
        {}
    );

    MapperContract = contract as unknown as Mapper;
    MapperFactory = contractFactory;
    initializeMapperContract = initialize;

    newMapInfo = await setMapInfo(0);
  });

  async function setMapInfo(mapId: number): Promise<IMapper.MapInfo> {
    const originTokens: any[] = [Token0, Token1, Token2, Token3, Token4];
    const targetTokens: any[] = [Token1, Token2, Token3, Token4, Token0];

    return {
      originChainId: BigInt(GlobalConfig.HARDHAT_ID),
      targetChainId: (mapId % 2 === 0) ? BigInt(GlobalConfig.WHITECHAIN_DEVNET_ID) : BigInt(GlobalConfig.ETHEREUM_MAINNET_ID),
      depositType: IMapper.DepositType.Lock,
      withdrawType: IMapper.WithdrawType.None,
      originTokenAddress: hre.ethers.zeroPadValue(await originTokens[mapId].getAddress(), 32),
      targetTokenAddress: hre.ethers.zeroPadValue(await targetTokens[mapId].getAddress(), 32),
      useTransfer: false,
      isAllowed: (mapId % 2 === 0),
      isCoin: !(mapId % 2 === 0)
    }
  }

  async function deployExampleToken(): Promise<any> {
    const contract = await coreDeployment.deployContract(
        IS_LOCALHOST,
        GlobalConfig.EXAMPLE_TOKEN_CONTRACT_NAME,
        deployer,
        [GlobalConfig.ETHER_1 * 100_000_000n]
    );
    return contract;
  }

  async function registerMappings() {
    for (let mapId = 0; mapId < 5; ++mapId) {
      let mapInfo = await setMapInfo(mapId);

      const registerMappingTransaction = await MapperContract.registerMapping(mapInfo);
      expect(registerMappingTransaction).to.not.be.reverted;

    }
  }

  describe("Deployment", function () {
    it("Should deploy successfully with valid arguments", async function () {
       expect(await MapperContract.getAddress()).to.be.properAddress;
    });

    it("Should upgrade Mapper contract successfully with valid arguments", async function () {
      const MapperTest =
          await hre.ethers.getContractFactory(GlobalConfig.MAPPER_TEST_CONTRACT_NAME);
      const contract = await hre.upgrades.upgradeProxy(
          MapperContract.target,
          MapperTest.connect(deployer)
      );
      let UpgradedMapper = contract as unknown as MapperTest;
      await expect(UpgradedMapper).to.not.be.reverted;
      expect(
          await UpgradedMapper.test()
      ).to.be.equal(0);
    });

    it("Unable to _authorizeUpgrade without Ownable", async function () {
      const MapperTest =
          await hre.ethers.getContractFactory(GlobalConfig.MAPPER_TEST_CONTRACT_NAME);
      await expect(
          hre.upgrades.upgradeProxy(
              MapperContract.target,
              MapperTest.connect(user1)
          ),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Initialize", function () {
    it("Cannot re-initialize Mapper contract", async function () {
      await expect(
          MapperContract.initialize({}),
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it("The owner must be deployer", async function () {
      expect(await MapperContract.owner()).to.be.equal(deployer.address);
    });
  });

  describe("registerMapping", async function () {
    it("Should be able to registerMapping", async function () {
      const registerMappingTransaction = await MapperContract.registerMapping(newMapInfo);
      expect(registerMappingTransaction).to.not.be.reverted;

      let mapCounter = await MapperContract.mapCounter();

      await expect(registerMappingTransaction)
          .to.emit(MapperContract, "RegisteredMapping")
          .withArgs(mapCounter, [
            newMapInfo.originChainId,
            newMapInfo.targetChainId,
            newMapInfo.depositType,
            newMapInfo.withdrawType,
            newMapInfo.originTokenAddress,
            newMapInfo.targetTokenAddress,
            newMapInfo.useTransfer,
            newMapInfo.isAllowed,
            newMapInfo.isCoin
          ]);

    });

    it("Should fail registerMapping if sender is NOT Owner", async function () {
      await expect(
          MapperContract.connect(user1).registerMapping(newMapInfo)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail to registerMapping with zero originTokenAddress", async function () {
      newMapInfo.originTokenAddress = hre.ethers.zeroPadValue(ZeroAddress, 32);
      await expect(
          MapperContract.registerMapping(newMapInfo)
      ).to.be.revertedWith("Mapper: Bytes must be not equal zero");
    });

    it("Should fail to registerMapping with zero targetTokenAddress", async function () {
      newMapInfo.targetTokenAddress = hre.ethers.zeroPadValue(ZeroAddress, 32);
      await expect(
          MapperContract.registerMapping(newMapInfo)
      ).to.be.revertedWith("Mapper: Bytes must be not equal zero");
    });

    it("Should fail to registerMapping with newMapInfo.originChainId NOT equal block.chainid", async function () {
      let oldOriginChainId = newMapInfo.originChainId;
      newMapInfo.originChainId = BigInt(GlobalConfig.WHITECHAIN_DEVNET_ID);
      await expect(
          MapperContract.registerMapping(newMapInfo)
      ).to.be.revertedWith("Mapper: ChainId must be equal to originChainId");
    });

    it("Should fail to registerMapping with newMapInfo.targetChainId NOT equal block.chainid", async function () {
      let oldOriginChainId = newMapInfo.originChainId;
      newMapInfo.targetChainId = BigInt(GlobalConfig.WHITECHAIN_DEVNET_ID);
      newMapInfo.depositType = IMapper.DepositType.None;
      newMapInfo.withdrawType = IMapper.WithdrawType.Unlock;
      await expect(
          MapperContract.registerMapping(newMapInfo)
      ).to.be.revertedWith("Mapper: ChainId must be equal to targetChainId");
    });

    it("Should fail to registerMapping with newMapInfo.depositType && newMapInfo.withdrawType equal None", async function () {
      newMapInfo.depositType = IMapper.DepositType.None;
      newMapInfo.withdrawType = IMapper.WithdrawType.None;
      await expect(
          MapperContract.registerMapping(newMapInfo)
      ).to.be.revertedWith("Mapper: Invalid map types");
    });

    it("Should fail to registerMapping where tokenStorage is busy", async function () {

      const registerMappingTransaction = await MapperContract.registerMapping(newMapInfo);
      expect(registerMappingTransaction).to.not.be.reverted;

      let _tokenStorage = await MapperContract.depositAllowedTokens(
          newMapInfo.targetChainId,
          newMapInfo.originTokenAddress
      );

      await expect(
          MapperContract.registerMapping(newMapInfo)
      ).to.be.revertedWith("Mapper: MapId must be equal to 0");

      newMapInfo.depositType = IMapper.DepositType.None;
      newMapInfo.withdrawType = IMapper.WithdrawType.Unlock;
      let targetChainId = newMapInfo.targetChainId;
      let originChainId = newMapInfo.originChainId;
      newMapInfo.targetChainId = originChainId;
      newMapInfo.originChainId = targetChainId;
      const registerMappingTransaction2 = await MapperContract.registerMapping(newMapInfo);
      expect(registerMappingTransaction2).to.not.be.reverted;

      await expect(
          MapperContract.registerMapping(newMapInfo)
      ).to.be.revertedWith("Mapper: MapId must be equal to 0");

      const mapCounter = await MapperContract.mapCounter();

      expect(mapCounter).to.be.equal(2);
    });

    it("Should fail to registerMapping where depositType != Lock && isCoin == true", async function () {
      newMapInfo.isCoin = true;
      newMapInfo.depositType = IMapper.DepositType.Burn;
      newMapInfo.withdrawType = IMapper.WithdrawType.None;
      await expect(
          MapperContract.registerMapping(newMapInfo)
      ).to.be.revertedWith("Mapper: DepositType must be equal to Lock");

      newMapInfo.depositType = IMapper.DepositType.Lock;
      const registerMappingTransaction2 = await MapperContract.registerMapping(newMapInfo);
      expect(registerMappingTransaction2).to.not.be.reverted;
    });

    it("Should fail to registerMapping where WithdrawType != Unlock && isCoin == true", async function () {
      newMapInfo.isCoin = true;
      newMapInfo.depositType = IMapper.DepositType.None;
      newMapInfo.withdrawType = IMapper.WithdrawType.Mint;
      let targetChainId = newMapInfo.targetChainId;
      let originChainId = newMapInfo.originChainId;
      newMapInfo.targetChainId = originChainId;
      newMapInfo.originChainId = targetChainId;
      await expect(
          MapperContract.registerMapping(newMapInfo)
      ).to.be.revertedWith("Mapper: WithdrawType must be equal to Unlock");

      newMapInfo.withdrawType = IMapper.WithdrawType.Unlock;
      const registerMappingTransaction2 = await MapperContract.registerMapping(newMapInfo);
      expect(registerMappingTransaction2).to.not.be.reverted;
    });

    it("Should be able registerMapping where WithdrawType != Unlock && isCoin == false", async function () {
      newMapInfo.isCoin = false;
      newMapInfo.depositType = IMapper.DepositType.None;
      newMapInfo.withdrawType = IMapper.WithdrawType.Unlock;
      let targetChainId = newMapInfo.targetChainId;
      let originChainId = newMapInfo.originChainId;
      newMapInfo.targetChainId = originChainId;
      newMapInfo.originChainId = targetChainId;
      const registerMappingTransaction2 = await MapperContract.registerMapping(newMapInfo);
      expect(registerMappingTransaction2).to.not.be.reverted;
    });

  });

  describe("enableMapping", async function () {

    async function enableMappingAndCheck(mapId: number, expectedAllowedBefore: boolean, expectedAllowedAfter: boolean) {
      await registerMappings();

      let oldMapInfo: IMapper.MapInfo = await MapperContract.mapInfo(mapId);
      expect(oldMapInfo.isAllowed).to.be.equal(expectedAllowedBefore);

      const enableMappingTransaction = await MapperContract.enableMapping(mapId);
      expect(enableMappingTransaction).to.not.be.reverted;

      let newMapInfo: IMapper.MapInfo = await MapperContract.mapInfo(mapId);
      expect(newMapInfo.isAllowed).to.be.equal(expectedAllowedAfter);

      await expect(enableMappingTransaction)
          .to.emit(MapperContract, "EnabledMapping")
          .withArgs(mapId, [
            newMapInfo.originChainId,
            newMapInfo.targetChainId,
            newMapInfo.depositType,
            newMapInfo.withdrawType,
            newMapInfo.originTokenAddress,
            newMapInfo.targetTokenAddress,
            newMapInfo.useTransfer,
            newMapInfo.isAllowed,
            newMapInfo.isCoin
          ]);

    }

    it("Should be able to enableMapping", async function () {
      await enableMappingAndCheck(MAP_ID_2, false, true);
    });

    it("Should fail enableMapping if sender is NOT Owner", async function () {
      await registerMappings();
      await expect(
          MapperContract.connect(user1).enableMapping(MAP_ID_2)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail enableMapping if mapCounter >= mapId", async function () {
      await enableMappingAndCheck(MAP_ID_2, false, true);

      let mapCounter = await MapperContract.mapCounter();

      await expect(
          MapperContract.enableMapping(failMapId)
      ).to.be.revertedWith("Mapper: MapCounter must be greater than or equal mapId");
    });

    it("Should fail enableMapping if isAllowed == true", async function () {
      await registerMappings();
      let oldMapInfo: IMapper.MapInfo = await MapperContract.mapInfo(MAP_ID_2);
      expect(oldMapInfo.isAllowed).to.be.equal(false);
      const enableMappingTransaction = await MapperContract.enableMapping(MAP_ID_2);
      expect(enableMappingTransaction).to.not.be.reverted;

      await expect(
          MapperContract.enableMapping(MAP_ID_2)
      ).to.be.revertedWith("Mapper: IsAllowed must be false");
    });

  });

  describe("disableMapping", async function () {

    async function disableMappingAndCheck(mapId: number, expectedAllowedBefore: boolean, expectedAllowedAfter: boolean) {
      await registerMappings();

      let oldMapInfo: IMapper.MapInfo = await MapperContract.mapInfo(mapId);
      expect(oldMapInfo.isAllowed).to.be.equal(expectedAllowedBefore);

      const disableMappingTransaction = await MapperContract.disableMapping(mapId);
      expect(disableMappingTransaction).to.not.be.reverted;

      let newMapInfo: IMapper.MapInfo = await MapperContract.mapInfo(mapId);
      expect(newMapInfo.isAllowed).to.be.equal(expectedAllowedAfter);

      await expect(disableMappingTransaction)
          .to.emit(MapperContract, "DisabledMapping")
          .withArgs(mapId, [
            newMapInfo.originChainId,
            newMapInfo.targetChainId,
            newMapInfo.depositType,
            newMapInfo.withdrawType,
            newMapInfo.originTokenAddress,
            newMapInfo.targetTokenAddress,
            newMapInfo.useTransfer,
            newMapInfo.isAllowed,
            newMapInfo.isCoin
          ]);
    }

    it("Should be able to disableMapping", async function () {
      await disableMappingAndCheck(MAP_ID_3, true, false);
    });

    it("Should fail disableMapping if sender is NOT Owner", async function () {
      await registerMappings();
      await expect(
          MapperContract.connect(user1).disableMapping(MAP_ID_3)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail disableMapping if mapCounter >= mapId", async function () {
      await disableMappingAndCheck(MAP_ID_3, true, false);

      let mapCounter = await MapperContract.mapCounter();
      await expect(
          MapperContract.disableMapping(failMapId)
      ).to.be.revertedWith("Mapper: MapCounter must be greater than or equal mapId");
    });

    it("Should fail disableMapping if isAllowed == false", async function () {
      await registerMappings();
      let oldMapInfo: IMapper.MapInfo = await MapperContract.mapInfo(MAP_ID_1);
      expect(oldMapInfo.isAllowed).to.be.equal(true);
      const disableMappingTransaction = await MapperContract.disableMapping(MAP_ID_1);
      expect(disableMappingTransaction).to.not.be.reverted;


      await expect(
          MapperContract.disableMapping(MAP_ID_1)
      ).to.be.revertedWith("Mapper: IsAllowed must be true");
    });
  });
});
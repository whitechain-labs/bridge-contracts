import hre from "hardhat";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
import {ZeroAddress} from "ethers";
import * as coreDeployment from "../../../ignition/core/deployment";
import * as GlobalConfig from "../../utils/GlobalConfig";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import {time} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import * as ethUtil from "ethereumjs-util";
import * as IBridge from "./interfaces/IBridge";
import * as IMapper from "../mapper/interfaces/IMapper";
import {Bridge, BridgeTest, Mapper, BridgeReentrancyAttack} from "../../../typechain-types";

chai.use(chaiAsPromised);

describe("Bridge", function () {

  let IS_LOCALHOST = true;
  let MapperContract: any;
  let MapperFactory: any;
  let BridgeContract: any;
  let BridgeFactory: any;
  let initializeMapperContract: any;
  let initializeBridgeContract: any;
  let Token0: any;
  let Token1: any;
  let Token2: any;
  let Token3: any;
  let Token4: any;
  let Token5: any;

  let bridgeArgs: IBridge.InitParams;

  let deployer: SignerWithAddress;
  let user0: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;

  const tokensPositionId = 0;

  enum typesMix {
    None_None,
    Lock_None,
    Burn_None,
    None_Unlock,
    Lock_Unlock,
    Burn_Unlock,
    None_Mint,
    Lock_Mint,
    Burn_Mint,
  }

  const allowedIds = {
    token: new Set([
      typesMix.Lock_None,
      typesMix.Burn_None,
      typesMix.None_Unlock,
      typesMix.None_Mint,
    ]),
    coin: new Set([
      typesMix.Lock_None,
      typesMix.None_Unlock,
    ]),
  };

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
    Token5 = await deployExampleToken();

    const {contract, contractFactory, initialize} = await coreDeployment.deployUUPSProxy(
        IS_LOCALHOST,
        GlobalConfig.MAIN_UTILS_ROUTE + "mapper/" + GlobalConfig.MAPPER_CONTRACT_NAME + ".sol:" + GlobalConfig.MAPPER_CONTRACT_NAME,
        deployer,
        {}
    );

    MapperContract = contract as unknown as Mapper;
    MapperFactory = contractFactory;
    initializeMapperContract = initialize;

    bridgeArgs = {
      mapperAddress: await MapperContract.getAddress()
    };

    const {
      contract: contract2,
      contractFactory: contractFactory2,
      initialize: initialize2
    } = await coreDeployment.deployUUPSProxy(
        IS_LOCALHOST,
        GlobalConfig.BRIDGE_CONTRACT_NAME,
        deployer,
        bridgeArgs
    );

    BridgeContract = contract2 as unknown as Bridge;
    BridgeFactory = contractFactory2;
    initializeBridgeContract = initialize2;

  });

  async function setMapInfo(tokensPositionId: number, useTransfer: boolean, isAllowed: boolean, isCoin: boolean): Promise<IMapper.MapInfo> {
    const ZeroAddress = {
      getAddress: async () => "0x0000000000000000000000000000000000000000"
    };
    const originTokens: any[] = [ZeroAddress,Token0, Token1, Token2, Token3, Token4, Token5, Token0, Token1, Token2];
    const targetTokens: any[] = [ZeroAddress,Token1, Token2, Token3, Token4, Token5, Token0, Token1, Token2, Token3];
    const types: any[] = [
      [IMapper.DepositType.None, IMapper.WithdrawType.None],
      [IMapper.DepositType.Lock, IMapper.WithdrawType.None],
      [IMapper.DepositType.Burn, IMapper.WithdrawType.None],
      [IMapper.DepositType.None, IMapper.WithdrawType.Unlock],
      [IMapper.DepositType.Lock, IMapper.WithdrawType.Unlock],
      [IMapper.DepositType.Burn, IMapper.WithdrawType.Unlock],
      [IMapper.DepositType.None, IMapper.WithdrawType.Mint],
      [IMapper.DepositType.Lock, IMapper.WithdrawType.Mint],
      [IMapper.DepositType.Burn, IMapper.WithdrawType.Mint],
    ];

    return {
      originChainId: (types[tokensPositionId][0] == 0) ? (isCoin ? BigInt(GlobalConfig.ETHEREUM_MAINNET_ID) : BigInt(GlobalConfig.WHITECHAIN_DEVNET_ID)) : BigInt(GlobalConfig.HARDHAT_ID),
      targetChainId: (types[tokensPositionId][0] == 0) ? BigInt(GlobalConfig.HARDHAT_ID) : (isCoin ? BigInt(GlobalConfig.ETHEREUM_MAINNET_ID) : BigInt(GlobalConfig.WHITECHAIN_DEVNET_ID)),
      depositType: types[tokensPositionId][0],
      withdrawType: types[tokensPositionId][1],
      originTokenAddress: hre.ethers.zeroPadValue(await originTokens[tokensPositionId].getAddress(), 32),
      targetTokenAddress: hre.ethers.zeroPadValue(await targetTokens[tokensPositionId].getAddress(), 32),
      useTransfer: useTransfer,
      isAllowed: isAllowed,
      isCoin: isCoin
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

  function bytes32ToAddress(value: string): string {
    const bytes = hre.ethers.getBytes(value);
    const last20 = bytes.slice(12);
    return hre.ethers.getAddress(hre.ethers.hexlify(last20));
  }

  async function registerMappings(
      isAllowed: boolean = true,
      useTransfer: boolean = false,
      _mapperContract = MapperContract,
      isBrokenMapper = false
  ) {
    let id = 0;
    for (let idTokens = id; idTokens < (Object.keys(typesMix).length / 2); ++idTokens) {
      if (!isBrokenMapper && !allowedIds.token.has(idTokens)) continue;

      let mapInfo = await setMapInfo(idTokens, useTransfer, isAllowed, false);
      const registerMappingTransaction = await _mapperContract.registerMapping(mapInfo);
      expect(registerMappingTransaction).to.not.be.reverted;
    }

    for (let idCoin = id; idCoin < (Object.keys(typesMix).length / 2); ++idCoin) {
      if (!isBrokenMapper && !allowedIds.coin.has(idCoin)) continue;

      let mapInfo = await setMapInfo(idCoin,useTransfer, isAllowed, true);
      const registerMappingTransaction = await _mapperContract.registerMapping(mapInfo);
      expect(registerMappingTransaction).to.not.be.reverted;
    }
  }

  async function ECDSAFixture(
      add = deployer.address,
      bridgeParams: {
        bridgeParams: IBridge.BridgeParams;
        gasAmount: bigint;
      },
      _mapperContract = MapperContract
  ): Promise<IBridge.ECDSAParams> {
    const _deadline: bigint = BigInt(await time.latest()) + BigInt(3600);
    const _salt: bigint = BigInt(await time.latest()) + BigInt(3600);
    const _saltHex = hre.ethers.toBeHex(_salt, 32);
    let mapInfo: IMapper.MapInfo = await _mapperContract.mapInfo(bridgeParams.bridgeParams.mapId);
    const message = hre.ethers.solidityPackedKeccak256(
        ["address", "address", "bytes32", "bytes32", "uint256", "uint256", "uint256", "uint256", "uint64", "bytes32"],
        [
          deployer.address,
          add,
          hre.ethers.zeroPadValue(bridgeParams.bridgeParams.toAddress, 32),
          mapInfo.targetTokenAddress,
          bridgeParams.gasAmount,
          bridgeParams.bridgeParams.amount,
          mapInfo.originChainId,
          mapInfo.targetChainId,
          _deadline,
          _saltHex
        ],
    );
    const messageBuffer = Buffer.from(message.slice(2), "hex");
    const privateKeyBuffer = Buffer.from(GlobalConfig.PRIVATE_KEY_ACC_0.slice(2), "hex");
    const ethMessageHash = ethUtil.hashPersonalMessage(messageBuffer);
    const signature = ethUtil.ecsign(ethMessageHash, privateKeyBuffer);
    const v: bigint = BigInt(signature.v);
    const r = `0x${signature.r.toString("hex")}`;
    const s = `0x${signature.s.toString("hex")}`;

    return ({r, s, salt: _saltHex, deadline: _deadline, v});
  }

  async function setBridgeParams(
      tokensPositionId: number = 1,
      useTransfer: boolean = false,
      isAllowed: boolean = true,
      isCoin: boolean = false,
      amount: bigint = 10000n,
      gasAmount: bigint = 500n,
      toAddress: string = deployer.address,
      originTokenAddress?: string,
      isBrokenMapper = false
  ): Promise<{
    bridgeParams: IBridge.BridgeParams;
    gasAmount: bigint;
  }> {
    const mapInfo = await setMapInfo(tokensPositionId, useTransfer, isAllowed, isCoin);
    const originToken = bytes32ToAddress(mapInfo.originTokenAddress);
    originTokenAddress = originTokenAddress ?? originToken;

    if (!mapInfo.isCoin) {
      const tokenContract = await hre.ethers.getContractAt(
          GlobalConfig.EXAMPLE_TOKEN_CONTRACT_NAME,
          originTokenAddress
      );

      let transactionResponse = await tokenContract.approve(
          await BridgeContract.getAddress(),
          amount
      );
    }

    let mapId = (!isBrokenMapper) ?
        (mapInfo.isCoin) ?
            (tokensPositionId == typesMix.Lock_None) ? 5n : 6n
            :
            (tokensPositionId == typesMix.None_Mint) ? 4n : BigInt(tokensPositionId)
        :
        (mapInfo.isCoin) ?
            BigInt(tokensPositionId) + 10n
            :
            BigInt(tokensPositionId) + 1n
    ;

    return {
      bridgeParams: {
        mapId: mapId,
        amount: amount,
        toAddress: hre.ethers.zeroPadValue(toAddress, 32)
      },
      gasAmount: gasAmount
    };
  }

  async function bridgeTokens(bridgeParams: {
    bridgeParams: IBridge.BridgeParams;
    gasAmount: bigint;
  }) {
    const ECDSA = await ECDSAFixture(undefined, bridgeParams);

    let mapInfo: IMapper.MapInfo = await MapperContract.mapInfo(bridgeParams.bridgeParams.mapId);
    let value;
    if (mapInfo.isCoin) {
      value = bridgeParams.gasAmount + bridgeParams.bridgeParams.amount;
    } else {
      value = bridgeParams.gasAmount;
    }
    const bridgeTokensTransaction = await BridgeContract.bridgeTokens([
      bridgeParams.bridgeParams,
      ECDSA
    ], {
      value: value
    });
    expect(bridgeTokensTransaction).to.not.be.reverted;

    await expect(bridgeTokensTransaction)
        .to.emit(BridgeContract, "Deposit")
        .withArgs(
            hre.ethers.zeroPadValue(deployer.address, 32),
            bridgeParams.bridgeParams.toAddress,
            mapInfo.originTokenAddress,
            mapInfo.targetTokenAddress,
            bridgeParams.bridgeParams.amount,
            mapInfo.originChainId,
            mapInfo.targetChainId
        );
  }

  describe("Deployment", function () {

    it("Should deploy successfully with valid arguments", async function () {
      expect(await MapperContract.getAddress()).to.be.properAddress;
      expect(await BridgeContract.getAddress()).to.be.properAddress;
    });

    it("Should upgrade Bridge contract successfully with valid arguments", async function () {
      const BridgeTest =
          await hre.ethers.getContractFactory(GlobalConfig.BRIDGE_TEST_CONTRACT_NAME);
      const contract = await hre.upgrades.upgradeProxy(
          BridgeContract.target,
          BridgeTest.connect(deployer)
      );
      let UpgradedBridge = contract as unknown as BridgeTest;
      await expect(UpgradedBridge).to.not.be.reverted;
      expect(
          await UpgradedBridge.test()
      ).to.be.equal(0);
    });

    it("Unable to _authorizeUpgrade without Ownable", async function () {
      const BridgeTest =
          await hre.ethers.getContractFactory(GlobalConfig.BRIDGE_TEST_CONTRACT_NAME);
      await expect(
          hre.upgrades.upgradeProxy(
              BridgeContract.target,
              BridgeTest.connect(user1)
          ),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

  });

  describe("Initialize", function () {

    it("Cannot re-initialize Bridge contract", async function () {
      await expect(
          BridgeContract.initialize(bridgeArgs),
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it("Should fail to initialize with zero mapperAddress", async function () {
      bridgeArgs.mapperAddress = ZeroAddress;

      const Bridge = await hre.upgrades.deployProxy(
          BridgeFactory,
          [bridgeArgs],
          {initializer: false},
      );
      await expect(
          Bridge.initialize(bridgeArgs),
      ).to.be.revertedWith("Bridge: Address must be not equal zero");
    });

    it("Should fail to initialize when Mapper address does not support IMapper", async function () {

      bridgeArgs.mapperAddress = user3.address;

      const Bridge = await hre.upgrades.deployProxy(
          BridgeFactory,
          [bridgeArgs],
          {initializer: false},
      );
      await expect(
          Bridge.initialize(bridgeArgs),
      ).to.be.revertedWith("Bridge: New address does not support IMapper");
    });
  });

  async function createMapperBrokenContract() {
    const {contract, contractFactory, initialize} = await coreDeployment.deployUUPSProxy(
        IS_LOCALHOST,
        GlobalConfig.TEST_UTILS_ROUTE + "stub/mapper-broken/" + GlobalConfig.MAPPER_CONTRACT_NAME + ".sol:" + GlobalConfig.MAPPER_CONTRACT_NAME,
        deployer,
        {}
    );

    let mapperBrokenContract: any = contract as unknown as Mapper;

    let changeMapperAddress = await BridgeContract.changeMapperAddress(await mapperBrokenContract.getAddress());
    expect(changeMapperAddress).to.not.be.reverted;
    return mapperBrokenContract;
  }

  describe("bridgeTokens", async function () {

    it("Should be able to bridgeTokens for Token", async function () {
      await registerMappings();
      const bridgeParams = await setBridgeParams();
      const ECDSA = await ECDSAFixture(undefined, bridgeParams);

      let mapInfo: IMapper.MapInfo = await MapperContract.mapInfo(bridgeParams.bridgeParams.mapId);

      const result = await hre.network.provider.send("eth_call", [
        {
          from: deployer.address,
          to: BridgeContract.target,
          value: bridgeParams.gasAmount.toString(),
          data: BridgeContract.interface.encodeFunctionData("bridgeTokens", [[bridgeParams.bridgeParams, ECDSA]])
        }
      ]);

      const bridgeTokensTransaction = await BridgeContract.bridgeTokens([
        bridgeParams.bridgeParams,
        ECDSA
      ], {
        value: bridgeParams.gasAmount
      });
      expect(bridgeTokensTransaction).to.not.be.reverted;

      await expect(bridgeTokensTransaction)
          .to.emit(BridgeContract, "Deposit")
          .withArgs(
              hre.ethers.zeroPadValue(deployer.address, 32),
              bridgeParams.bridgeParams.toAddress,
              mapInfo.originTokenAddress,
              mapInfo.targetTokenAddress,
              bridgeParams.bridgeParams.amount,
              mapInfo.originChainId,
              mapInfo.targetChainId
          );

      const tokenContract = await hre.ethers.getContractAt(
          GlobalConfig.EXAMPLE_TOKEN_CONTRACT_NAME,
          bytes32ToAddress(mapInfo.originTokenAddress)
      );

      await expect(bridgeTokensTransaction).to.changeTokenBalances(
          tokenContract,
          [deployer.address, BridgeContract],
          [-bridgeParams.bridgeParams.amount, bridgeParams.bridgeParams.amount],
      );

      await expect(bridgeTokensTransaction).to.changeEtherBalances(
          [deployer.address, BridgeContract],
          [-bridgeParams.gasAmount, bridgeParams.gasAmount],
      );
    });

    it("Should be able to bridgeTokens for Token && depositType == None", async function () {

      let mapperBrokenContract = await createMapperBrokenContract();
      await registerMappings(undefined, undefined, mapperBrokenContract, true);
      const bridgeParams = await setBridgeParams(typesMix.None_None, undefined, undefined, undefined, undefined, undefined, undefined, undefined, true);
      const ECDSA = await ECDSAFixture(undefined, bridgeParams, mapperBrokenContract);

      await expect(
          BridgeContract.bridgeTokens([
            bridgeParams.bridgeParams,
            ECDSA
          ], {
            value: bridgeParams.gasAmount
          })
      ).to.be.revertedWith("Bridge: DepositType must not be equal to None");

    });

    it("Should be able to bridgeTokens for Coin", async function () {
      await registerMappings();
      const bridgeParams = await setBridgeParams(typesMix.Lock_None, undefined, undefined, true);
      const ECDSA = await ECDSAFixture(undefined, bridgeParams);

      let mapInfo = await MapperContract.mapInfo(bridgeParams.bridgeParams.mapId);

      const bridgeTokensTransaction = await BridgeContract.bridgeTokens([
        bridgeParams.bridgeParams,
        ECDSA
      ], {
        value: bridgeParams.gasAmount + bridgeParams.bridgeParams.amount
      });
      expect(bridgeTokensTransaction).to.not.be.reverted;


      await expect(bridgeTokensTransaction)
          .to.emit(BridgeContract, "Deposit")
          .withArgs(
              hre.ethers.zeroPadValue(deployer.address, 32),
              bridgeParams.bridgeParams.toAddress,
              mapInfo.originTokenAddress,
              mapInfo.targetTokenAddress,
              bridgeParams.bridgeParams.amount,
              mapInfo.originChainId,
              mapInfo.targetChainId
          );

      const tokenContract = await hre.ethers.getContractAt(
          GlobalConfig.EXAMPLE_TOKEN_CONTRACT_NAME,
          mapInfo.originTokenAddress
      );

      await expect(bridgeTokensTransaction).to.changeEtherBalances(
          [deployer.address, BridgeContract],
          [-(bridgeParams.gasAmount + bridgeParams.bridgeParams.amount), bridgeParams.gasAmount + bridgeParams.bridgeParams.amount],
      );
    });

    it("Should be able to bridgeTokens for Coin && depositType != Lock", async function () {
      let mapperBrokenContract = await createMapperBrokenContract();

      await registerMappings(undefined, undefined, mapperBrokenContract, true);
      const bridgeParams = await setBridgeParams(typesMix.None_None, undefined, undefined, true, undefined, undefined, undefined, undefined, true);
      const ECDSA = await ECDSAFixture(undefined, bridgeParams, mapperBrokenContract);

      await expect(
          BridgeContract.bridgeTokens([
            bridgeParams.bridgeParams,
            ECDSA
          ], {
            value: bridgeParams.gasAmount + bridgeParams.bridgeParams.amount
          })
      ).to.be.revertedWith("Bridge: DepositType must be equal to Lock");
    });

    it("Should fail to bridgeTokens when signature nonce is used a second time", async function () {
      await registerMappings();
      const bridgeParams = await setBridgeParams();
      const ECDSA = await ECDSAFixture(undefined, bridgeParams);

      let mapInfo: IMapper.MapInfo = await MapperContract.mapInfo(bridgeParams.bridgeParams.mapId);

      const result = await hre.network.provider.send("eth_call", [
        {
          from: deployer.address,
          to: BridgeContract.target,
          value: bridgeParams.gasAmount.toString(),
          data: BridgeContract.interface.encodeFunctionData("bridgeTokens", [[bridgeParams.bridgeParams, ECDSA]])
        }
      ]);

      const bridgeTokensTransaction = await BridgeContract.bridgeTokens([
        bridgeParams.bridgeParams,
        ECDSA
      ], {
        value: bridgeParams.gasAmount
      });
      expect(bridgeTokensTransaction).to.not.be.reverted;

      await expect(bridgeTokensTransaction)
          .to.emit(BridgeContract, "Deposit")
          .withArgs(
              hre.ethers.zeroPadValue(deployer.address, 32),
              bridgeParams.bridgeParams.toAddress,
              mapInfo.originTokenAddress,
              mapInfo.targetTokenAddress,
              bridgeParams.bridgeParams.amount,
              mapInfo.originChainId,
              mapInfo.targetChainId
          );

      const tokenContract = await hre.ethers.getContractAt(
          GlobalConfig.EXAMPLE_TOKEN_CONTRACT_NAME,
          bytes32ToAddress(mapInfo.originTokenAddress)
      );

      await expect(bridgeTokensTransaction).to.changeTokenBalances(
          tokenContract,
          [deployer.address, BridgeContract],
          [-bridgeParams.bridgeParams.amount, bridgeParams.bridgeParams.amount],
      );

      await expect(bridgeTokensTransaction).to.changeEtherBalances(
          [deployer.address, BridgeContract],
          [-bridgeParams.gasAmount, bridgeParams.gasAmount],
      );

      await expect(
          BridgeContract.bridgeTokens([
            bridgeParams.bridgeParams,
            ECDSA
          ], {
            value: bridgeParams.gasAmount
          })
      ).to.be.revertedWith("Bridge: Hash already used");

    });

    it("Should fail to bridgeTokens with zero toAddress", async function () {
      await registerMappings();
      const bridgeParams = await setBridgeParams(undefined, undefined, undefined, undefined, undefined, undefined, ZeroAddress);
      const ECDSA = await ECDSAFixture(undefined, bridgeParams);

      await expect(
          BridgeContract.bridgeTokens([
            bridgeParams.bridgeParams,
            ECDSA
          ], {
            value: bridgeParams.gasAmount
          })
      ).to.be.revertedWith("Bridge: Bytes must be not equal zero");
    });

    it("Should fail to bridgeTokens with amount == 0", async function () {
      await registerMappings();

      const bridgeParams = await setBridgeParams(undefined, undefined, undefined, undefined, 0n);
      const ECDSA = await ECDSAFixture(undefined ,bridgeParams);

      await expect(
          BridgeContract.bridgeTokens([
            bridgeParams.bridgeParams,
            ECDSA
          ], {
            value: bridgeParams.gasAmount
          })
      ).to.be.revertedWith("Bridge: Cannot be zero");
    });

    it("Should fail to bridgeTokens with isAllowed == false", async function () {
      await registerMappings(false);
      const bridgeParams = await setBridgeParams();
      const ECDSA = await ECDSAFixture(undefined, bridgeParams);

      await expect(
          BridgeContract.bridgeTokens([
            bridgeParams.bridgeParams,
            ECDSA
          ], {
            value: bridgeParams.gasAmount
          })
      ).to.be.revertedWith("Bridge: IsAllowed must be true");
    });

    it("Should fail to bridgeTokens with withdrawType != None", async function () {
      await registerMappings();
      const bridgeParams = await setBridgeParams(typesMix.None_Unlock);
      const ECDSA = await ECDSAFixture(undefined, bridgeParams);

      await expect(
          BridgeContract.bridgeTokens([
            bridgeParams.bridgeParams,
            ECDSA
          ], {
            value: bridgeParams.gasAmount
          })
      ).to.be.revertedWith("Bridge: WithdrawType must be equal to None");
    });

    it("Should fail to bridgeTokens with msg.value < amount", async function () {
      await registerMappings();
      const bridgeParams = await setBridgeParams(typesMix.Lock_None, undefined, undefined, true);
      const ECDSA = await ECDSAFixture(undefined, bridgeParams);

      await expect(
          BridgeContract.bridgeTokens([
            bridgeParams.bridgeParams,
            ECDSA
          ], {
            value: bridgeParams.bridgeParams.amount - 1n
          })
      ).to.be.revertedWith("Bridge: The msg.value must be greater than or equal amount");
    });

    it("Should fail to bridgeTokens with depositType == Burn", async function () {
      await registerMappings();
      const bridgeParams = await setBridgeParams(typesMix.Burn_None);
      const ECDSA = await ECDSAFixture(undefined, bridgeParams);

      let bridgeTokensTransaction = await BridgeContract.bridgeTokens([
        bridgeParams.bridgeParams,
        ECDSA
      ], {
        value: bridgeParams.gasAmount
      });

      expect(bridgeTokensTransaction).to.not.be.reverted;
      let mapInfo = await MapperContract.mapInfo(bridgeParams.bridgeParams.mapId);

      const tokenContract = await hre.ethers.getContractAt(
          GlobalConfig.EXAMPLE_TOKEN_CONTRACT_NAME,
          bytes32ToAddress(mapInfo.originTokenAddress)
      );

      await expect(bridgeTokensTransaction).to.changeTokenBalances(
          tokenContract,
          [deployer.address, BridgeContract],
          [-bridgeParams.bridgeParams.amount, 0],
      );
    });

    it("Should fail to bridgeTokens when reentrancy attack", async function () {
      const contract = await coreDeployment.deployContract(
          IS_LOCALHOST,
          GlobalConfig.TEST_UTILS_ROUTE + "stub/example-token-broken/ExampleTokenBroken.sol:ExampleTokenBroken",
          deployer,
          [GlobalConfig.ETHER_1 * 100_000_000n]
      );
      let amount = 22n;
      let gasAmount = 200n;
      let transactionResponse = await contract.approve(
          await BridgeContract.getAddress(),
          amount
      );
      await registerMappings();
      await MapperContract.registerMapping({
        originChainId: BigInt(GlobalConfig.HARDHAT_ID),
        targetChainId: BigInt(GlobalConfig.WHITECHAIN_DEVNET_ID),
        depositType: IMapper.DepositType.Burn,
        withdrawType: IMapper.WithdrawType.None,
        originTokenAddress: hre.ethers.zeroPadValue(await contract.getAddress(), 32),
        targetTokenAddress: hre.ethers.zeroPadValue(await Token5.getAddress(), 32),
        useTransfer: false,
        isAllowed: true,
        isCoin: false
      });

      let mapId = await MapperContract.mapCounter();

      const bridgeParams = {
        bridgeParams: {
          mapId: mapId,
          amount: amount,
          toAddress: hre.ethers.zeroPadValue(deployer.address, 32),
        },
        gasAmount: gasAmount,
      };

      await time.setNextBlockTimestamp(2748620000);
      await hre.ethers.provider.send("evm_mine", []);

      const ECDSA = await ECDSAFixture(undefined, bridgeParams);

      await expect(
          BridgeContract.bridgeTokens([
            bridgeParams.bridgeParams,
            ECDSA
          ], {
            value: bridgeParams.gasAmount
          })
      ).to.be.revertedWith("ReentrancyGuard: reentrant call");

    });

    it("Should be able to bridgeTokens when useTransfer == true", async function () {
      await registerMappings(undefined, true);
      const bridgeParams = await setBridgeParams();
      const ECDSA = await ECDSAFixture(undefined, bridgeParams);

      let mapInfo: IMapper.MapInfo = await MapperContract.mapInfo(bridgeParams.bridgeParams.mapId);

      const bridgeTokensTransaction = await BridgeContract.bridgeTokens([
        bridgeParams.bridgeParams,
        ECDSA
      ], {
        value: bridgeParams.gasAmount
      });
      expect(bridgeTokensTransaction).to.not.be.reverted;

      const tokenContract = await hre.ethers.getContractAt(
          GlobalConfig.EXAMPLE_TOKEN_CONTRACT_NAME,
          bytes32ToAddress(mapInfo.originTokenAddress)
      );

      await expect(bridgeTokensTransaction)
          .to.emit(tokenContract, "Transfer")
          .withArgs(
              deployer.address,
              await BridgeContract.getAddress(),
              bridgeParams.bridgeParams.amount
          );

      await expect(bridgeTokensTransaction)
          .to.emit(BridgeContract, "Deposit")
          .withArgs(
              hre.ethers.zeroPadValue(deployer.address, 32),
              bridgeParams.bridgeParams.toAddress,
              mapInfo.originTokenAddress,
              mapInfo.targetTokenAddress,
              bridgeParams.bridgeParams.amount,
              mapInfo.originChainId,
              mapInfo.targetChainId
          );

      await expect(bridgeTokensTransaction).to.changeTokenBalances(
          tokenContract,
          [deployer.address, BridgeContract],
          [-bridgeParams.bridgeParams.amount, bridgeParams.bridgeParams.amount],
      );

      await expect(bridgeTokensTransaction).to.changeEtherBalances(
          [deployer.address, BridgeContract],
          [-bridgeParams.gasAmount, bridgeParams.gasAmount],
      );
    });

  });

  async function chargeTokensBridgeContract() {
    const originTokens: any[] = [Token0, Token1, Token2, Token3, Token4, Token5];

    for (let id = 0; id < 6; ++id) {

      let requestTokens = await originTokens[id].requestTokens();
      expect(requestTokens).to.not.be.reverted;

      let requestAmount: bigint = BigInt(await originTokens[id].REQUEST_AMOUNT());
      let transfer = await originTokens[id].transfer(
          BridgeContract.target,
          requestAmount
      );
      expect(transfer).to.not.be.reverted;
    }
  }

  async function chargeCoinsBridgeContract(amount: bigint = 10000n) {
    const bridgeParams = await setBridgeParams(typesMix.Lock_None, undefined, undefined, true, amount);
    const ECDSA = await ECDSAFixture(undefined, bridgeParams);

    const bridgeTokensTransaction = await BridgeContract.bridgeTokens([
      bridgeParams.bridgeParams,
      ECDSA
    ], {
      value: bridgeParams.bridgeParams.amount + bridgeParams.gasAmount
    });
    expect(bridgeTokensTransaction).to.not.be.reverted;
  }

  describe("receiveTokens", async function () {

    it("Should be able to receiveTokens Tokens", async function () {
      await registerMappings();
      await chargeTokensBridgeContract();
      let externalId = hre.ethers.encodeBytes32String("externalId");
      let amount = 1000n;

      const receiveTokensTransaction = await BridgeContract.receiveTokens([
        externalId,
        typesMix.None_Unlock,
        amount,
        hre.ethers.zeroPadValue(user1.address, 32),
        hre.ethers.zeroPadValue(user2.address, 32)
      ]);
      expect(receiveTokensTransaction).to.not.be.reverted;

      const mapInfo: IMapper.MapInfo = await MapperContract.mapInfo(typesMix.None_Unlock);

      await expect(receiveTokensTransaction)
          .to.emit(BridgeContract, "Withdrawal")
          .withArgs(
              hre.ethers.zeroPadValue(user1.address, 32),
              hre.ethers.zeroPadValue(user2.address, 32),
              mapInfo.targetTokenAddress,
              mapInfo.originTokenAddress,
              externalId,
              amount,
              mapInfo.originChainId,
              mapInfo.targetChainId
          );

      const tokenContract = await hre.ethers.getContractAt(
          GlobalConfig.EXAMPLE_TOKEN_CONTRACT_NAME,
          bytes32ToAddress(mapInfo.targetTokenAddress)
      );

      await expect(receiveTokensTransaction).to.changeTokenBalances(
              tokenContract,
          [user2.address, BridgeContract],
          [amount, -amount],
          );

    });

    it("Should be able to receiveTokens Tokens Mint", async function () {
      await registerMappings();
      await chargeTokensBridgeContract();
      let externalId = hre.ethers.encodeBytes32String("externalId");
      let amount = 1000n;
      const bridgeParams = await setBridgeParams(typesMix.None_Mint);

      const receiveTokensTransaction = await BridgeContract.receiveTokens([
        externalId,
        bridgeParams.bridgeParams.mapId,
        amount,
        hre.ethers.zeroPadValue(user1.address, 32),
        hre.ethers.zeroPadValue(user2.address, 32)
      ]);
      expect(receiveTokensTransaction).to.not.be.reverted;

      const mapInfo: IMapper.MapInfo = await MapperContract.mapInfo(bridgeParams.bridgeParams.mapId);

      await expect(receiveTokensTransaction)
          .to.emit(BridgeContract, "Withdrawal")
          .withArgs(
              hre.ethers.zeroPadValue(user1.address, 32),
              hre.ethers.zeroPadValue(user2.address, 32),
              mapInfo.targetTokenAddress,
              mapInfo.originTokenAddress,
              externalId,
              amount,
              mapInfo.originChainId,
              mapInfo.targetChainId
          );

      const tokenContract = await hre.ethers.getContractAt(
          GlobalConfig.EXAMPLE_TOKEN_CONTRACT_NAME,
          bytes32ToAddress(mapInfo.targetTokenAddress)
      );

      await expect(receiveTokensTransaction).to.changeTokenBalances(
          tokenContract,
          [user2.address],
          [amount],
      );
    });

    it("Should be able to receiveTokens for Coin && withdrawType != Unlock", async function () {
      let mapperBrokenContract = await createMapperBrokenContract();

      await registerMappings(undefined, undefined, mapperBrokenContract, true);
      const bridgeParams = await setBridgeParams(typesMix.None_None, undefined, undefined, undefined, undefined, undefined, undefined, undefined, true);
      let externalId = hre.ethers.encodeBytes32String("externalId");
      let amount = 1000n;
      let mapInfo = await mapperBrokenContract.mapInfo(bridgeParams.bridgeParams.mapId);

      await expect(
          BridgeContract.receiveTokens([
            externalId,
            bridgeParams.bridgeParams.mapId,
            amount,
            hre.ethers.zeroPadValue(user1.address, 32),
            hre.ethers.zeroPadValue(user2.address, 32)
          ])
      ).to.be.revertedWith("Bridge: WithdrawType must not be equal to None");
    });

    it("Should be able to receiveTokens Coins", async function () {
      await registerMappings();
      await chargeTokensBridgeContract();
      await chargeCoinsBridgeContract();

      let externalId = hre.ethers.encodeBytes32String("externalId");
      let amount = 1000n;
      const bridgeParams = await setBridgeParams(typesMix.None_Unlock, undefined, undefined, true);

      const receiveTokensTransaction = await BridgeContract.receiveTokens([
        externalId,
        bridgeParams.bridgeParams.mapId,
        amount,
        hre.ethers.zeroPadValue(user1.address, 32),
        hre.ethers.zeroPadValue(user2.address, 32)
      ]);
      expect(receiveTokensTransaction).to.not.be.reverted;

      const mapInfo: IMapper.MapInfo = await MapperContract.mapInfo(bridgeParams.bridgeParams.mapId);

      await expect(receiveTokensTransaction)
          .to.emit(BridgeContract, "Withdrawal")
          .withArgs(
              hre.ethers.zeroPadValue(user1.address, 32),
              hre.ethers.zeroPadValue(user2.address, 32),
              mapInfo.targetTokenAddress,
              mapInfo.originTokenAddress,
              externalId,
              amount,
              mapInfo.originChainId,
              mapInfo.targetChainId
          );

      await expect(receiveTokensTransaction).to.changeEtherBalances(
          [user2.address, BridgeContract],
          [amount, -amount],
      );

    });

    it("Should fail receiveTokens Coins if (bool success,) != true", async function () {
      await registerMappings();
      await chargeTokensBridgeContract();
      await chargeCoinsBridgeContract();

      let externalId = hre.ethers.encodeBytes32String("externalId");
      let amount = 1000n;
      const bridgeParams = await setBridgeParams(typesMix.None_Unlock, undefined, undefined, true);

      await expect(
          BridgeContract.receiveTokens([
            externalId,
            bridgeParams.bridgeParams.mapId,
            amount,
            hre.ethers.zeroPadValue(user1.address, 32),
            hre.ethers.zeroPadValue(await Token0.getAddress(), 32)
          ])
      ).to.be.revertedWith("Bridge: Failed to send coins");


    });

    it("Should be able to receiveTokens for Coin && withdrawType != Unlock", async function () {
      let mapperBrokenContract = await createMapperBrokenContract();

      await registerMappings(undefined, undefined, mapperBrokenContract, true);
      const bridgeParams = await setBridgeParams(typesMix.None_None, undefined, undefined, true, undefined, undefined, undefined, undefined, true);
      let externalId = hre.ethers.encodeBytes32String("externalId");
      let amount = 1000n;
      let mapInfo = await mapperBrokenContract.mapInfo(bridgeParams.bridgeParams.mapId);

      await expect(
          BridgeContract.receiveTokens([
            externalId,
            bridgeParams.bridgeParams.mapId,
            amount,
            hre.ethers.zeroPadValue(user1.address, 32),
            hre.ethers.zeroPadValue(user2.address, 32)
          ])
      ).to.be.revertedWith("Bridge: WithdrawType must be equal to Unlock");
    });

    it("Should fail receiveTokens Coins if contractBalance < amount", async function () {
      await registerMappings();
      await chargeTokensBridgeContract();
      await chargeCoinsBridgeContract(1n);

      let externalId = hre.ethers.encodeBytes32String("externalId");
      let amount = 10000n;
      const bridgeParams = await setBridgeParams(typesMix.None_Unlock, undefined, undefined, true);

      await expect(
          BridgeContract.receiveTokens([
            externalId,
            bridgeParams.bridgeParams.mapId,
            amount,
            hre.ethers.zeroPadValue(user1.address, 32),
            hre.ethers.zeroPadValue(user2.address, 32)
          ])
      ).to.be.revertedWith("Bridge: Contract coins balance must be greater or equal amount");

    });

    it("Should fail receiveTokens if sender is NOT Owner", async function () {
      await registerMappings();
      await chargeTokensBridgeContract();
      let externalId = hre.ethers.encodeBytes32String("externalId");
      let amount = 1000n;

      await expect(
          BridgeContract.connect(user2).receiveTokens([
            externalId,
            typesMix.None_Unlock,
            amount,
            hre.ethers.zeroPadValue(user1.address, 32),
            hre.ethers.zeroPadValue(user2.address, 32)
          ])
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail receiveTokens with zero fromAddress", async function () {
      await registerMappings();
      await chargeTokensBridgeContract();
      let externalId = hre.ethers.encodeBytes32String("externalId");
      let amount = 1000n;

      await expect(
          BridgeContract.receiveTokens([
            externalId,
            typesMix.None_Unlock,
            amount,
            hre.ethers.zeroPadValue(ZeroAddress, 32),
            hre.ethers.zeroPadValue(user2.address, 32)
          ])
      ).to.be.revertedWith("Bridge: Bytes must be not equal zero");
    });

    it("Should fail receiveTokens with zero toAddress", async function () {
      await registerMappings();
      await chargeTokensBridgeContract();
      let externalId = hre.ethers.encodeBytes32String("externalId");
      let amount = 1000n;

      await expect(
          BridgeContract.receiveTokens([
            externalId,
            typesMix.None_Unlock,
            amount,
            hre.ethers.zeroPadValue(user1.address, 32),
            hre.ethers.zeroPadValue(ZeroAddress, 32)
          ])
      ).to.be.revertedWith("Bridge: Bytes must be not equal zero");
    });

    it("Should fail receiveTokens with zero amount", async function () {
      await registerMappings();
      await chargeTokensBridgeContract();
      let externalId = hre.ethers.encodeBytes32String("externalId");
      let amount = 0n;

      await expect(
          BridgeContract.receiveTokens([
            externalId,
            typesMix.None_Unlock,
            amount,
            hre.ethers.zeroPadValue(user1.address, 32),
            hre.ethers.zeroPadValue(user2.address, 32)
          ])
      ).to.be.revertedWith("Bridge: Cannot be zero");
    });

    it("Should fail receiveTokens with isAllowed == false", async function () {
      await registerMappings(false);
      await chargeTokensBridgeContract();
      let externalId = hre.ethers.encodeBytes32String("externalId");
      let amount = 1000n;

      await expect(
          BridgeContract.receiveTokens([
            externalId,
            typesMix.None_Unlock,
            amount,
            hre.ethers.zeroPadValue(user1.address, 32),
            hre.ethers.zeroPadValue(user2.address, 32)
          ])
      ).to.be.revertedWith("Bridge: IsAllowed must be true");
    });

    it("Should fail receiveTokens with depositType != None", async function () {
      await registerMappings();
      await chargeTokensBridgeContract();
      let externalId = hre.ethers.encodeBytes32String("externalId");
      let amount = 1000n;
      let mapInfo: IMapper.MapInfo = await MapperContract.mapInfo(typesMix.Lock_None);
      await expect(
          BridgeContract.receiveTokens([
            externalId,
            typesMix.Lock_None,
            amount,
            hre.ethers.zeroPadValue(user1.address, 32),
            hre.ethers.zeroPadValue(user2.address, 32)
          ])
      ).to.be.revertedWith("Bridge: DepositType must be equal to None");
    });

    it("Should fail to receiveTokens when reentrancy attack", async function () {
      const contract = await coreDeployment.deployContract(
          IS_LOCALHOST,
          GlobalConfig.TEST_UTILS_ROUTE + "stub/example-token-broken/ExampleTokenBroken.sol:ExampleTokenBroken",
          deployer,
          [GlobalConfig.ETHER_1 * 100_000_000n]
      );
      let amount = 22n;
      let gasAmount = 200n;
      let transactionResponse = await contract.approve(
          await BridgeContract.getAddress(),
          amount
      );

      await registerMappings();
      await MapperContract.registerMapping({
        originChainId: BigInt(GlobalConfig.WHITECHAIN_DEVNET_ID),
        targetChainId: BigInt(GlobalConfig.HARDHAT_ID),
        depositType: IMapper.DepositType.None,
        withdrawType: IMapper.WithdrawType.Unlock,
        originTokenAddress: hre.ethers.zeroPadValue(await Token5.getAddress(), 32),
        targetTokenAddress: hre.ethers.zeroPadValue(await contract.getAddress(), 32),
        useTransfer: false,
        isAllowed: true,
        isCoin: false
      });

      let mapId = await MapperContract.mapCounter();

      let externalId = hre.ethers.encodeBytes32String("externalId");

      const receiveTokensParams = {
        externalId: externalId,
        mapId: mapId,
        amount: amount,
        fromAddress: hre.ethers.zeroPadValue(user1.address, 32),
        toAddress: hre.ethers.zeroPadValue(user2.address, 32)
      };

      await expect(
        BridgeContract.receiveTokens(receiveTokensParams)
      ).to.be.revertedWith("ReentrancyGuard: reentrant call");

    });

    it("Should be able to receiveTokens when useTransfer == true", async function () {
      await registerMappings(undefined, true);
      await chargeTokensBridgeContract();
      let externalId = hre.ethers.encodeBytes32String("externalId");
      let amount = 1000n;

      const receiveTokensTransaction = await BridgeContract.receiveTokens([
        externalId,
        typesMix.None_Unlock,
        amount,
        hre.ethers.zeroPadValue(user1.address, 32),
        hre.ethers.zeroPadValue(user2.address, 32)
      ]);
      expect(receiveTokensTransaction).to.not.be.reverted;

      const mapInfo: IMapper.MapInfo = await MapperContract.mapInfo(typesMix.None_Unlock);

      await expect(receiveTokensTransaction)
          .to.emit(BridgeContract, "Withdrawal")
          .withArgs(
              hre.ethers.zeroPadValue(user1.address, 32),
              hre.ethers.zeroPadValue(user2.address, 32),
              mapInfo.targetTokenAddress,
              mapInfo.originTokenAddress,
              externalId,
              amount,
              mapInfo.originChainId,
              mapInfo.targetChainId
          );

      const tokenContract = await hre.ethers.getContractAt(
          GlobalConfig.EXAMPLE_TOKEN_CONTRACT_NAME,
          bytes32ToAddress(mapInfo.targetTokenAddress)
      );

      await expect(receiveTokensTransaction)
          .to.emit(tokenContract, "Transfer")
          .withArgs(
              await BridgeContract.getAddress(),
              user2.address,
              amount
          );

      await expect(receiveTokensTransaction).to.changeTokenBalances(
          tokenContract,
          [user2.address, BridgeContract],
          [amount, -amount],
      );

    });

  });

  describe("changeMapperAddress", async function () {

    it("Should be able to changeMapperAddress", async function () {
      const oldMapperAddress = await BridgeContract.Mapper();
      expect(oldMapperAddress).to.be.equal(await MapperContract.getAddress());

      const {contract, contractFactory, initialize} = await coreDeployment.deployUUPSProxy(
          IS_LOCALHOST,
          GlobalConfig.MAIN_UTILS_ROUTE + "mapper/" + GlobalConfig.MAPPER_CONTRACT_NAME + ".sol:" + GlobalConfig.MAPPER_CONTRACT_NAME,
          deployer,
          {}
      );

      const newMapparAddress = await contract.getAddress();
      const changeMapperAddress = await BridgeContract.changeMapperAddress(newMapparAddress);
      expect(changeMapperAddress).to.not.be.reverted;

      const newMapperAddress = await BridgeContract.Mapper();
      expect(newMapperAddress).to.be.equal(newMapparAddress);

      await expect(changeMapperAddress)
          .to.emit(BridgeContract, "MapperAddressChanged")
          .withArgs(
              deployer.address,
              oldMapperAddress,
              newMapperAddress
          );
    });

    it("Should fail changeMapperAddress New address does not support IMapper", async function () {
      const oldMapperAddress = await BridgeContract.Mapper();
      expect(oldMapperAddress).to.be.equal(await MapperContract.getAddress());
      await expect(
          BridgeContract.changeMapperAddress(user3)
      ).to.be.revertedWith("Bridge: New address does not support IMapper");
    });

    it("Should fail to changeMapperAddress with zero _newMapperAddress", async function () {
      await expect(
          BridgeContract.changeMapperAddress(ZeroAddress)
      ).to.be.revertedWith("Bridge: Address must be not equal zero");
    });

    it("Should fail changeMapperAddress if sender is NOT Owner", async function () {
      await expect(
          BridgeContract.connect(user1).changeMapperAddress(user3)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

  });

  describe("removeMapping", async function () {

    it("Should be able to removeMapping for deposit", async function () {
      await registerMappings();
      const bridgeParams = await setBridgeParams(typesMix.Burn_None);

      let depositMapInfo: IMapper.MapInfo = await MapperContract.mapInfo(bridgeParams.bridgeParams.mapId);
      expect(depositMapInfo.originChainId).to.be.equal(GlobalConfig.HARDHAT_ID);

      let depositAllowedTokens = await MapperContract.depositAllowedTokens(
          depositMapInfo.targetChainId,
          depositMapInfo.originTokenAddress
      );
      expect(depositAllowedTokens).to.be.equal(bridgeParams.bridgeParams.mapId);
      await MapperContract.removeMapping(bridgeParams.bridgeParams.mapId);
      let newMapInfo: IMapper.MapInfo = await MapperContract.mapInfo(bridgeParams.bridgeParams.mapId);

      expect(newMapInfo.targetChainId).to.be.equal(0);

      let newDepositAllowedTokens = await MapperContract.depositAllowedTokens(
          depositMapInfo.targetChainId,
          depositMapInfo.originTokenAddress
      );

      expect(newDepositAllowedTokens).to.be.equal(0);
    });

    it("Should be able to removeMapping for withdraw", async function () {
      await registerMappings();
      const withdrawParams = await setBridgeParams(typesMix.None_Unlock);
      const ECDSA = await ECDSAFixture(undefined, withdrawParams);

      let withdrawMapInfo: IMapper.MapInfo = await MapperContract.mapInfo(withdrawParams.bridgeParams.mapId);
      expect(withdrawMapInfo.originChainId).to.be.equal(GlobalConfig.WHITECHAIN_DEVNET_ID);
      expect(withdrawMapInfo.targetChainId).to.be.equal(GlobalConfig.HARDHAT_ID);

      let mapId = await MapperContract.withdrawAllowedTokens(
          withdrawMapInfo.originChainId,
          withdrawMapInfo.targetTokenAddress
      );
      expect(mapId).to.be.equal(withdrawParams.bridgeParams.mapId);

      await MapperContract.removeMapping(withdrawParams.bridgeParams.mapId);

      let newMapInfo: IMapper.MapInfo = await MapperContract.mapInfo(withdrawParams.bridgeParams.mapId);
      expect(newMapInfo.targetChainId).to.be.equal(0);

      let newMapId = await MapperContract.withdrawAllowedTokens(
          withdrawMapInfo.targetChainId,
          withdrawMapInfo.originTokenAddress
      );

      expect(newMapId).to.be.equal(0);
    });

    it("Should fail removeMapping if sender is NOT Owner", async function () {
      await expect(
          MapperContract.connect(user1).removeMapping(1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail removeMapping if mapCounter < mapId", async function () {
      await expect(
          MapperContract.removeMapping(failMapId)
      ).to.be.revertedWith("Mapper: MapCounter must be greater than or equal mapId");
    });

    it("Should fail removeMapping if Invalid mapId", async function () {
      await registerMappings();
      const bridgeParams = await setBridgeParams(typesMix.None_Unlock);

      let withdrawMapInfo: IMapper.MapInfo = await MapperContract.mapInfo(bridgeParams.bridgeParams.mapId);
      expect(withdrawMapInfo.originChainId).to.be.equal(GlobalConfig.WHITECHAIN_DEVNET_ID);
      expect(withdrawMapInfo.targetChainId).to.be.equal(GlobalConfig.HARDHAT_ID);

      let mapId = await MapperContract.withdrawAllowedTokens(
          withdrawMapInfo.originChainId,
          withdrawMapInfo.targetTokenAddress
      );
      expect(mapId).to.be.equal(bridgeParams.bridgeParams.mapId);

      await MapperContract.removeMapping(bridgeParams.bridgeParams.mapId);

      await expect(
          MapperContract.removeMapping(bridgeParams.bridgeParams.mapId)
      ).to.be.revertedWith("Mapper: Invalid mapId");

    });

  });

  describe("receive", async function () {

    it("Should be able to receive Coins", async function () {
      const amount = 1000000n;

      const receiveCoinsTransaction = await user1.sendTransaction({
        to: BridgeContract.target,
        value: amount,
      });

      await expect(receiveCoinsTransaction)
          .to.emit(BridgeContract, "CoinsDeposited")
          .withArgs(
              user1.address,
              amount,
          );

      await expect(receiveCoinsTransaction).to.changeEtherBalances(
         [user1.address, BridgeContract],
         [-amount, amount],
      );

    });

  });

  describe("depositCoins", async function () {

    it("Should be able to depositCoins", async function () {
      const amount = 1000000n;

      const depositCoinsTransaction = await BridgeContract.depositCoins({ value: amount });

      await expect(depositCoinsTransaction)
          .to.emit(BridgeContract, "CoinsDeposited")
          .withArgs(
              deployer.address,
              amount,
          );

      await expect(depositCoinsTransaction).to.changeEtherBalances(
         [deployer.address, BridgeContract],
         [-amount, amount],
      );

    });

    it("Should fail depositCoins if amount is zero", async function () {
      await expect(
        BridgeContract.depositCoins()
      ).to.be.revertedWith("Bridge: Cannot be zero");
    });

    it("Should fail depositCoins if sender is NOT Owner", async function () {
      const amount = 1000000n;
      await expect(
          BridgeContract.connect(user1).depositCoins({ value: amount })
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

  });

  describe("depositTokens", async function () {

    it("Should be able to depositTokens", async function () {
      const amount = 1000000n;
      await registerMappings();
      const bridgeParams = await setBridgeParams(typesMix.None_Unlock);

      let mapInfo: IMapper.MapInfo = await MapperContract.mapInfo(bridgeParams.bridgeParams.mapId);

      const targetTokenAddress = bytes32ToAddress(mapInfo.targetTokenAddress);

      const tokenContract = await hre.ethers.getContractAt(
          GlobalConfig.EXAMPLE_TOKEN_CONTRACT_NAME,
          targetTokenAddress
      );
      let transactionResponse = await tokenContract.approve(
          await BridgeContract.getAddress(),
          amount
      );

      const depositTokensTransaction = await BridgeContract.depositTokens(bridgeParams.bridgeParams.mapId, amount);

      const targetToken = bytes32ToAddress(mapInfo.targetTokenAddress);

      await expect(depositTokensTransaction)
          .to.emit(BridgeContract, "TokensDeposited")
          .withArgs(
              deployer.address,
              targetToken,
              amount,
          );

      await expect(depositTokensTransaction).to.changeTokenBalances(
          tokenContract,
         [deployer.address, BridgeContract],
         [-amount, amount],
      );

    });

    it("Should fail depositTokens if amount is zero", async function () {
      const amount = 0n;
      await registerMappings();
      const bridgeParams = await setBridgeParams(typesMix.None_Unlock);

      let mapInfo: IMapper.MapInfo = await MapperContract.mapInfo(bridgeParams.bridgeParams.mapId);
      await expect(
          BridgeContract.depositTokens(bridgeParams.bridgeParams.mapId, amount)
      ).to.be.revertedWith("Bridge: Cannot be zero");
    });

    it("Should fail depositTokens if mapId is сoin", async function () {
      const amount = 100000n;
      await registerMappings();
      const bridgeParams = await setBridgeParams(typesMix.None_Unlock, undefined, undefined, true);

      let mapInfo: IMapper.MapInfo = await MapperContract.mapInfo(bridgeParams.bridgeParams.mapId);
      await expect(
          BridgeContract.depositTokens(bridgeParams.bridgeParams.mapId, amount)
      ).to.be.revertedWith("Bridge: Deposit allowed only for token mappings");
    });

    it("Should fail depositTokens if depositType !== None", async function () {
      const amount = 100000n;
      let mapperBrokenContract = await createMapperBrokenContract();
      await registerMappings(undefined, undefined, mapperBrokenContract, true);
      const bridgeParams = await setBridgeParams(typesMix.Lock_None, undefined, undefined, undefined, undefined, undefined, undefined, undefined, true);

      let mapInfo: IMapper.MapInfo = await mapperBrokenContract.mapInfo(bridgeParams.bridgeParams.mapId);
      await expect(
          BridgeContract.depositTokens(bridgeParams.bridgeParams.mapId, amount)
      ).to.be.revertedWith("Bridge: DepositType must be equal to None");
    });

    it("Should fail depositTokens if targetTokenAddress == address(0)", async function () {
      const amount = 100000n;
      let mapperBrokenContract = await createMapperBrokenContract();
      await registerMappings(undefined, undefined, mapperBrokenContract, true);
      const bridgeParams = await setBridgeParams(typesMix.None_None, undefined, undefined, undefined, undefined, undefined, undefined, undefined, true);

      let mapInfo: IMapper.MapInfo = await mapperBrokenContract.mapInfo(bridgeParams.bridgeParams.mapId);

      await expect(
          BridgeContract.depositTokens(bridgeParams.bridgeParams.mapId, amount)
      ).to.be.revertedWith("Bridge: TargetTokenAddress must be not equal zero");
    });

    it("Should fail depositTokens if sender is NOT Owner", async function () {
      const amount = 100000n;
      let mapperBrokenContract = await createMapperBrokenContract();
      await registerMappings(undefined, undefined, mapperBrokenContract, true);
      const bridgeParams = await setBridgeParams(typesMix.None_None, undefined, undefined, undefined, undefined, undefined, undefined, undefined, true);

      let mapInfo: IMapper.MapInfo = await mapperBrokenContract.mapInfo(bridgeParams.bridgeParams.mapId);

      await expect(
          BridgeContract.connect(user1).depositTokens(bridgeParams.bridgeParams.mapId, amount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail depositTokens with isAllowed == false", async function () {
      const amount = 100000n;
      let mapperBrokenContract = await createMapperBrokenContract();
      await registerMappings(false, undefined, mapperBrokenContract, true);
      const bridgeParams = await setBridgeParams(typesMix.None_Unlock, undefined, undefined, undefined, undefined, undefined, undefined, undefined, true);
      let mapInfo: IMapper.MapInfo = await mapperBrokenContract.mapInfo(bridgeParams.bridgeParams.mapId);
      await expect(
          BridgeContract.depositTokens(bridgeParams.bridgeParams.mapId, amount)
      ).to.be.revertedWith("Bridge: IsAllowed must be true");
    });

    it("Should fail to depositTokens when reentrancy attack", async function () {
      const contract = await coreDeployment.deployContract(
          IS_LOCALHOST,
          GlobalConfig.TEST_UTILS_ROUTE + "stub/example-token-broken/DPReentrancyAttack.sol:DPReentrancyAttack",
          deployer,
          [GlobalConfig.ETHER_1 * 100_000_000n]
      );
      let amount = 22n;
      let gasAmount = 200n;
      let transactionResponse = await contract.approve(
          await BridgeContract.getAddress(),
          amount
      );
      await registerMappings();
      await MapperContract.registerMapping({
        originChainId: BigInt(GlobalConfig.WHITECHAIN_DEVNET_ID),
        targetChainId: BigInt(GlobalConfig.HARDHAT_ID),
        depositType: IMapper.DepositType.None,
        withdrawType: IMapper.WithdrawType.Unlock,
        originTokenAddress: hre.ethers.zeroPadValue(await Token5.getAddress(), 32),
        targetTokenAddress: hre.ethers.zeroPadValue(await contract.getAddress(), 32),
        useTransfer: false,
        isAllowed: true,
        isCoin: false
      });

      let mapId = await MapperContract.mapCounter();

      await expect(
          BridgeContract.depositTokens(mapId, amount)
      ).to.be.revertedWith("ReentrancyGuard: reentrant call");

    });

    it("Should be able to depositTokens when useTransfer == true", async function () {
      const amount = 1000000n;
      await registerMappings(undefined, true);
      const bridgeParams = await setBridgeParams(typesMix.None_Unlock);

      let mapInfo: IMapper.MapInfo = await MapperContract.mapInfo(bridgeParams.bridgeParams.mapId);

      const targetTokenAddress = bytes32ToAddress(mapInfo.targetTokenAddress);

      const tokenContract = await hre.ethers.getContractAt(
          GlobalConfig.EXAMPLE_TOKEN_CONTRACT_NAME,
          targetTokenAddress
      );

      let transactionResponse = await tokenContract.approve(
          await BridgeContract.getAddress(),
          amount
      );

      const depositTokensTransaction = await BridgeContract.depositTokens(bridgeParams.bridgeParams.mapId, amount);

      const targetToken = bytes32ToAddress(mapInfo.targetTokenAddress);

      await expect(depositTokensTransaction)
          .to.emit(tokenContract, "Transfer")
          .withArgs(
              deployer.address,
              await BridgeContract.getAddress(),
              amount
          );

      await expect(depositTokensTransaction)
          .to.emit(BridgeContract, "TokensDeposited")
          .withArgs(
              deployer.address,
              targetToken,
              amount,
          );

      await expect(depositTokensTransaction).to.changeTokenBalances(
          tokenContract,
          [deployer.address, BridgeContract],
          [-amount, amount],
      );

    });

  });

  describe("withdrawGasAccumulated", async function () {

    it("Should be able to withdrawGasAccumulated", async function () {
      await registerMappings();
      const bridgeParams1: {
        bridgeParams: IBridge.BridgeParams;
        gasAmount: bigint;
      } = await setBridgeParams();
      await bridgeTokens(bridgeParams1);
      const bridgeParams2: {
        bridgeParams: IBridge.BridgeParams;
        gasAmount: bigint;
      } = await setBridgeParams();
      await bridgeTokens(bridgeParams2);
      const bridgeParams3: {
        bridgeParams: IBridge.BridgeParams;
        gasAmount: bigint;
      } = await setBridgeParams();
      await bridgeTokens(bridgeParams3);
      let gas =  bridgeParams1.gasAmount * 3n;
      const gasAccumulated = await BridgeContract.gasAccumulated();
      expect(gasAccumulated).to.be.equal(gas);

      const withdrawGasAccumulatedTransaction = await BridgeContract.withdrawGasAccumulated();

      await expect(withdrawGasAccumulatedTransaction)
          .to.emit(BridgeContract, "GasAccumulatedWithdrawn")
          .withArgs(
              deployer.address,
              gasAccumulated
          );
    });

    it("Should fail withdrawGasAccumulated if gasAccumulated is zero", async function () {
      await registerMappings();
      const bridgeParams1: {
        bridgeParams: IBridge.BridgeParams;
        gasAmount: bigint;
      } = await setBridgeParams();
      await bridgeTokens(bridgeParams1);
      const bridgeParams2: {
        bridgeParams: IBridge.BridgeParams;
        gasAmount: bigint;
      } = await setBridgeParams();
      await bridgeTokens(bridgeParams2);
      const bridgeParams3: {
        bridgeParams: IBridge.BridgeParams;
        gasAmount: bigint;
      } = await setBridgeParams();
      await bridgeTokens(bridgeParams3);
      let gas =  bridgeParams1.gasAmount * 3n;
      const gasAccumulated = await BridgeContract.gasAccumulated();
      expect(gasAccumulated).to.be.equal(gas);

      const withdrawGasAccumulatedTransaction = await BridgeContract.withdrawGasAccumulated();

      await expect(withdrawGasAccumulatedTransaction)
          .to.emit(BridgeContract, "GasAccumulatedWithdrawn")
          .withArgs(
              deployer.address,
              gasAccumulated
          );

      await expect(
          BridgeContract.withdrawGasAccumulated()
      ).to.be.revertedWith("Bridge: Cannot be zero");

    });

    it("Should fail withdrawGasAccumulated if sender is NOT Owner", async function () {
      await registerMappings();
      const bridgeParams1: {
        bridgeParams: IBridge.BridgeParams;
        gasAmount: bigint;
      } = await setBridgeParams();
      await bridgeTokens(bridgeParams1);

      await expect(
          BridgeContract.connect(user1).withdrawGasAccumulated()
      ).to.be.revertedWith("Ownable: caller is not the owner");

    });

    it("Should fail withdrawGasAccumulated if balance < gasAccumulated", async function () {
      await registerMappings();
      const bridgeParams1 = await setBridgeParams();
      await bridgeTokens(bridgeParams1);

      await hre.network.provider.send("hardhat_setBalance", [
        await BridgeContract.getAddress(),
        "0x0",
      ]);

      await expect(
          BridgeContract.withdrawGasAccumulated()
      ).to.be.revertedWith("Bridge: Coins balance must be greater or equal gasAccumulated");

    });

    it("Should fail withdrawGasAccumulated if (bool success,) != true", async function () {
      await registerMappings();
      const bridgeParams1: {
        bridgeParams: IBridge.BridgeParams;
        gasAmount: bigint;
      } = await setBridgeParams();
      await bridgeTokens(bridgeParams1);

      const BridgeWrapperFactory = await hre.ethers.getContractFactory(GlobalConfig.TEST_UTILS_ROUTE + 'wrappers/BridgeWrapper.sol:BridgeWrapper');
      const BridgeWrapper = await BridgeWrapperFactory.deploy();

      await BridgeContract.transferOwnership(await BridgeWrapper.getAddress());
      await BridgeWrapper.acceptOwnership(await BridgeContract.getAddress());

      await expect(
          BridgeWrapper.withdrawGasAccumulatedWrapper(await BridgeContract.getAddress())
      ).to.be.revertedWith("Bridge: Gas accumulated withdrawal failed");

    });


    async function createBridgeReentrancyAttackContract() {
      const contract = await coreDeployment.deployContract(
          IS_LOCALHOST,
          GlobalConfig.TEST_UTILS_ROUTE + "stub/bridge-reentrancy-attack/BridgeReentrancyAttack.sol:BridgeReentrancyAttack",
          deployer,
          [ await BridgeContract.getAddress() ]
      );

      let BridgeReentrancyAttackContract: any = contract as unknown as BridgeReentrancyAttack;

      let changeMapperAddress = await BridgeContract.transferOwnership(await BridgeReentrancyAttackContract.getAddress());
      await BridgeReentrancyAttackContract.acceptOwnership(await BridgeContract.getAddress());
      expect(changeMapperAddress).to.not.be.reverted;
      return BridgeReentrancyAttackContract;
    }

    it("Should fail to withdrawGasAccumulated when reentrancy attack", async function () {
      await registerMappings();
      const bridgeParams1: {
        bridgeParams: IBridge.BridgeParams;
        gasAmount: bigint;
      } = await setBridgeParams();
      await bridgeTokens(bridgeParams1);
      const bridgeParams2: {
        bridgeParams: IBridge.BridgeParams;
        gasAmount: bigint;
      } = await setBridgeParams();
      await bridgeTokens(bridgeParams2);
      const bridgeParams3: {
        bridgeParams: IBridge.BridgeParams;
        gasAmount: bigint;
      } = await setBridgeParams();
      await bridgeTokens(bridgeParams3);
      let gas =  bridgeParams1.gasAmount * 3n;
      const gasAccumulated = await BridgeContract.gasAccumulated();
      expect(gasAccumulated).to.be.equal(gas);

      let bridgeReentrancyAttackContract = await createBridgeReentrancyAttackContract();

      await expect(
          bridgeReentrancyAttackContract.attack()
      ).to.be.revertedWith("Bridge: Gas accumulated withdrawal failed");
    });

  });

  describe("withdrawTokenLiquidity", async function () {

    it("Should be able to withdrawTokenLiquidity for tokens", async function () {
      await registerMappings();
      const bridgeParams1: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams1);
      const bridgeParams2: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams2);
      const bridgeParams3: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams3);

      const mapInfo = await setMapInfo(Number(bridgeParams3.bridgeParams.mapId), false, true, false);
      const tokenContract = await hre.ethers.getContractAt(
          GlobalConfig.EXAMPLE_TOKEN_CONTRACT_NAME,
          bytes32ToAddress(mapInfo.originTokenAddress)
      );

      const balanceBefore = await tokenContract.balanceOf(await BridgeContract.getAddress());

      let totalAmount =  bridgeParams1.bridgeParams.amount + bridgeParams2.bridgeParams.amount + bridgeParams3.bridgeParams.amount;

      expect(balanceBefore).to.be.equal(totalAmount);

      let mapId2 = await MapperContract.withdrawAllowedTokens(
          mapInfo.targetChainId,
          mapInfo.originTokenAddress
      );

      const mapInfo2: IMapper.MapInfo = await MapperContract.mapInfo(mapId2);

      const withdrawTokenLiquidityTransaction = await BridgeContract.withdrawTokenLiquidity({
          tokenAddress: mapInfo2.targetTokenAddress,
          recipientAddress: user1.address,
          amount: BigInt(totalAmount),
          useTransfer: mapInfo2.useTransfer,
        });

      await expect(withdrawTokenLiquidityTransaction).to.changeTokenBalances(
          tokenContract,
          [BridgeContract.target, user1.address],
          [-totalAmount, totalAmount],
      );

      await expect(withdrawTokenLiquidityTransaction)
          .to.emit(BridgeContract, "LiquidityTokenWithdrawn")
          .withArgs(
              user1.address,
              bytes32ToAddress(mapInfo2.targetTokenAddress),
              totalAmount,
              mapInfo2.useTransfer,
          );
    });

    it("Should fail withdrawTokenLiquidity if sender is NOT Owner", async function () {
      await registerMappings();
      const bridgeParams1: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams1);
      const bridgeParams2: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams2);
      const bridgeParams3: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams3);

      const mapInfo = await setMapInfo(Number(bridgeParams3.bridgeParams.mapId), false, true, false);
      const tokenContract = await hre.ethers.getContractAt(
          GlobalConfig.EXAMPLE_TOKEN_CONTRACT_NAME,
          bytes32ToAddress(mapInfo.originTokenAddress)
      );

      const balanceBefore = await tokenContract.balanceOf(await BridgeContract.getAddress());

      let totalAmount =  bridgeParams1.bridgeParams.amount + bridgeParams2.bridgeParams.amount + bridgeParams3.bridgeParams.amount;

      expect(balanceBefore).to.be.equal(totalAmount);

      let mapId2 = await MapperContract.withdrawAllowedTokens(
          mapInfo.targetChainId,
          mapInfo.originTokenAddress
      );

      const mapInfo2: IMapper.MapInfo = await MapperContract.mapInfo(mapId2);

      await expect(
        BridgeContract.connect(user1).withdrawTokenLiquidity({
          tokenAddress: mapInfo2.targetTokenAddress,
          recipientAddress: user1.address,
          amount: BigInt(totalAmount),
          useTransfer: mapInfo2.useTransfer,
        })
      ).to.be.revertedWith("Ownable: caller is not the owner");

    });

    it("Should fail withdrawTokenLiquidity if amount is zero", async function () {
      await registerMappings();
      const bridgeParams1: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams1);
      const bridgeParams2: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams2);
      const bridgeParams3: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams3);

      const mapInfo = await setMapInfo(Number(bridgeParams3.bridgeParams.mapId), false, true, false);
      const tokenContract = await hre.ethers.getContractAt(
          GlobalConfig.EXAMPLE_TOKEN_CONTRACT_NAME,
          bytes32ToAddress(mapInfo.originTokenAddress)
      );

      const balanceBefore = await tokenContract.balanceOf(await BridgeContract.getAddress());

      let totalAmount =  bridgeParams1.bridgeParams.amount + bridgeParams2.bridgeParams.amount + bridgeParams3.bridgeParams.amount;

      expect(balanceBefore).to.be.equal(totalAmount);

      let mapId2 = await MapperContract.withdrawAllowedTokens(
          mapInfo.targetChainId,
          mapInfo.originTokenAddress
      );

      const mapInfo2: IMapper.MapInfo = await MapperContract.mapInfo(mapId2);

      await expect(
          BridgeContract.withdrawTokenLiquidity({
            tokenAddress: mapInfo2.targetTokenAddress,
            recipientAddress: user1.address,
            amount: BigInt(0),
            useTransfer: mapInfo2.useTransfer,
          })
      ).to.be.revertedWith("Bridge: Cannot be zero");

    });

    it("Should fail withdrawTokenLiquidity if tokenAddress is zero", async function () {
      await registerMappings();
      const bridgeParams1: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams1);
      const bridgeParams2: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams2);
      const bridgeParams3: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams3);

      const mapInfo = await setMapInfo(Number(bridgeParams3.bridgeParams.mapId), false, true, false);
      const tokenContract = await hre.ethers.getContractAt(
          GlobalConfig.EXAMPLE_TOKEN_CONTRACT_NAME,
          bytes32ToAddress(mapInfo.originTokenAddress)
      );

      const balanceBefore = await tokenContract.balanceOf(await BridgeContract.getAddress());

      let totalAmount =  bridgeParams1.bridgeParams.amount + bridgeParams2.bridgeParams.amount + bridgeParams3.bridgeParams.amount;

      expect(balanceBefore).to.be.equal(totalAmount);

      let mapId2 = await MapperContract.withdrawAllowedTokens(
          mapInfo.targetChainId,
          mapInfo.originTokenAddress
      );

      const mapInfo2: IMapper.MapInfo = await MapperContract.mapInfo(mapId2);

      await expect(
          BridgeContract.withdrawTokenLiquidity({
            tokenAddress: hre.ethers.zeroPadValue(ZeroAddress, 32),
            recipientAddress: user1.address,
            amount: BigInt(totalAmount),
            useTransfer: mapInfo2.useTransfer,
          })
      ).to.be.revertedWith("Bridge: Bytes must be not equal zero");

    });

    it("Should fail withdrawTokenLiquidity if withdrawRecipient is zero", async function () {
      await registerMappings();
      const bridgeParams1: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams1);
      const bridgeParams2: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams2);
      const bridgeParams3: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams3);

      const mapInfo = await setMapInfo(Number(bridgeParams3.bridgeParams.mapId), false, true, false);
      const tokenContract = await hre.ethers.getContractAt(
          GlobalConfig.EXAMPLE_TOKEN_CONTRACT_NAME,
          bytes32ToAddress(mapInfo.originTokenAddress)
      );

      const balanceBefore = await tokenContract.balanceOf(await BridgeContract.getAddress());

      let totalAmount =  bridgeParams1.bridgeParams.amount + bridgeParams2.bridgeParams.amount + bridgeParams3.bridgeParams.amount;

      expect(balanceBefore).to.be.equal(totalAmount);

      let mapId2 = await MapperContract.withdrawAllowedTokens(
          mapInfo.targetChainId,
          mapInfo.originTokenAddress
      );

      const mapInfo2: IMapper.MapInfo = await MapperContract.mapInfo(mapId2);

      await expect(
          BridgeContract.withdrawTokenLiquidity({
            tokenAddress: mapInfo2.targetTokenAddress,
            recipientAddress: ZeroAddress,
            amount: BigInt(totalAmount),
            useTransfer: mapInfo2.useTransfer,
          })
      ).to.be.revertedWith("Bridge: Address must be not equal zero");

    });

    it("Should fail withdrawTokenLiquidity when reentrancy attack", async function () {
      const contract = await coreDeployment.deployContract(
          IS_LOCALHOST,
          GlobalConfig.TEST_UTILS_ROUTE + "stub/example-token-broken/WTLReentrancyAttack.sol:WTLReentrancyAttack",
          deployer,
          [GlobalConfig.ETHER_1 * 100_000_000n]
      );
      let amount = 22n;
      let gasAmount = 200n;
      let mintTransaction = await contract.mint(
          await BridgeContract.getAddress(),
          amount * 100n
      );

      await mintTransaction.wait();

      let transactionResponse = await contract.approve(
          await BridgeContract.getAddress(),
          amount
      );

      await registerMappings();
      await MapperContract.registerMapping({
        originChainId: BigInt(GlobalConfig.WHITECHAIN_DEVNET_ID),
        targetChainId: BigInt(GlobalConfig.HARDHAT_ID),
        depositType: IMapper.DepositType.None,
        withdrawType: IMapper.WithdrawType.Unlock,
        originTokenAddress: hre.ethers.zeroPadValue(await Token5.getAddress(), 32),
        targetTokenAddress: hre.ethers.zeroPadValue(await contract.getAddress(), 32),
        useTransfer: false,
        isAllowed: true,
        isCoin: false
      });

      let mapId = await MapperContract.mapCounter();
      const mapInfo2: IMapper.MapInfo = await MapperContract.mapInfo(mapId);
      await expect(
          BridgeContract.withdrawTokenLiquidity({
            tokenAddress: hre.ethers.zeroPadValue(await contract.getAddress(), 32),
            recipientAddress: user1.address,
            amount: amount,
            useTransfer: mapInfo2.useTransfer,
          })
      ).to.be.revertedWith("ReentrancyGuard: reentrant call");

    });

  });

  describe("withdrawCoinLiquidity", async function () {

    it("Should be able to withdrawCoinLiquidity for coins", async function () {
       await registerMappings();
       const bridgeParams1 = await setBridgeParams(typesMix.Lock_None, undefined, undefined, true);
       await bridgeTokens(bridgeParams1);
       const bridgeParams2 = await setBridgeParams(typesMix.Lock_None, undefined, undefined, true);
       await bridgeTokens(bridgeParams2);
       const bridgeParams3 = await setBridgeParams(typesMix.Lock_None, undefined, undefined, true);
       await bridgeTokens(bridgeParams3);

       const mapInfo = await setMapInfo(Number(bridgeParams3.bridgeParams.mapId), false, true, true);

       const balanceBefore = await hre.ethers.provider.getBalance(BridgeContract.target);

       let totalGasAmount =  bridgeParams1.gasAmount + bridgeParams2.gasAmount + bridgeParams3.gasAmount;
       let totalAmount =  bridgeParams1.bridgeParams.amount + bridgeParams2.bridgeParams.amount + bridgeParams3.bridgeParams.amount;

       expect(balanceBefore - totalGasAmount).to.be.equal(totalAmount);

       let mapId2 = await MapperContract.withdrawAllowedTokens(
           mapInfo.targetChainId,
           mapInfo.originTokenAddress
       );
       mapId2 = 6;
       const mapInfo2: IMapper.MapInfo = await MapperContract.mapInfo(mapId2);

       const withdrawCoinLiquidityTransaction = await BridgeContract.withdrawCoinLiquidity({
         recipientAddress: user1.address,
         amount: totalAmount,
       });

       await expect(withdrawCoinLiquidityTransaction).to.changeEtherBalances(
           [BridgeContract.target, user1.address],
           [-totalAmount, totalAmount],
       );

       await expect(withdrawCoinLiquidityTransaction)
           .to.emit(BridgeContract, "LiquidityCoinWithdrawn")
           .withArgs(
               user1.address,
               totalAmount
           );
     });

    it("Should fail withdrawCoinLiquidity if sender is NOT Owner", async function () {
      await registerMappings();
      const bridgeParams1: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams1);
      const bridgeParams2: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams2);
      const bridgeParams3: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams3);

      const mapInfo = await setMapInfo(Number(bridgeParams3.bridgeParams.mapId), false, true, false);
      const tokenContract = await hre.ethers.getContractAt(
          GlobalConfig.EXAMPLE_TOKEN_CONTRACT_NAME,
          bytes32ToAddress(mapInfo.originTokenAddress)
      );

      const balanceBefore = await tokenContract.balanceOf(await BridgeContract.getAddress());

      let totalAmount =  bridgeParams1.bridgeParams.amount + bridgeParams2.bridgeParams.amount + bridgeParams3.bridgeParams.amount;

      expect(balanceBefore).to.be.equal(totalAmount);

      let mapId2 = await MapperContract.withdrawAllowedTokens(
          mapInfo.targetChainId,
          mapInfo.originTokenAddress
      );

      const mapInfo2: IMapper.MapInfo = await MapperContract.mapInfo(mapId2);

      await expect(
          BridgeContract.connect(user1).withdrawCoinLiquidity({
            recipientAddress: user1.address,
            amount: totalAmount,
          })
      ).to.be.revertedWith("Ownable: caller is not the owner");

    });

    it("Should fail withdrawCoinLiquidity if amount is zero", async function () {
      await registerMappings();
      const bridgeParams1: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams1);
      const bridgeParams2: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams2);
      const bridgeParams3: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams3);

      const mapInfo = await setMapInfo(Number(bridgeParams3.bridgeParams.mapId), false, true, false);
      const tokenContract = await hre.ethers.getContractAt(
          GlobalConfig.EXAMPLE_TOKEN_CONTRACT_NAME,
          bytes32ToAddress(mapInfo.originTokenAddress)
      );

      const balanceBefore = await tokenContract.balanceOf(await BridgeContract.getAddress());

      let totalAmount =  bridgeParams1.bridgeParams.amount + bridgeParams2.bridgeParams.amount + bridgeParams3.bridgeParams.amount;

      expect(balanceBefore).to.be.equal(totalAmount);

      let mapId2 = await MapperContract.withdrawAllowedTokens(
          mapInfo.targetChainId,
          mapInfo.originTokenAddress
      );

      const mapInfo2: IMapper.MapInfo = await MapperContract.mapInfo(mapId2);

      await expect(
          BridgeContract.withdrawCoinLiquidity({
            recipientAddress: user1.address,
            amount: BigInt(0),
          })
      ).to.be.revertedWith("Bridge: Cannot be zero");

    });

    it("Should fail withdrawCoinLiquidity if withdrawRecipient is zero", async function () {
      await registerMappings();
      const bridgeParams1: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams1);
      const bridgeParams2: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams2);
      const bridgeParams3: { bridgeParams: IBridge.BridgeParams; gasAmount: bigint; } = await setBridgeParams();
      await bridgeTokens(bridgeParams3);

      const mapInfo = await setMapInfo(Number(bridgeParams3.bridgeParams.mapId), false, true, false);
      const tokenContract = await hre.ethers.getContractAt(
          GlobalConfig.EXAMPLE_TOKEN_CONTRACT_NAME,
          bytes32ToAddress(mapInfo.originTokenAddress)
      );

      const balanceBefore = await tokenContract.balanceOf(await BridgeContract.getAddress());

      let totalAmount =  bridgeParams1.bridgeParams.amount + bridgeParams2.bridgeParams.amount + bridgeParams3.bridgeParams.amount;

      expect(balanceBefore).to.be.equal(totalAmount);

      let mapId2 = await MapperContract.withdrawAllowedTokens(
          mapInfo.targetChainId,
          mapInfo.originTokenAddress
      );

      const mapInfo2: IMapper.MapInfo = await MapperContract.mapInfo(mapId2);

      await expect(
          BridgeContract.withdrawCoinLiquidity({
            recipientAddress: ZeroAddress,
            amount: totalAmount,
          })
      ).to.be.revertedWith("Bridge: Address must be not equal zero");

    });

    it("Should fail withdrawCoinLiquidity if balance < amount for coins", async function () {
      await registerMappings();
      const bridgeParams1 = await setBridgeParams(typesMix.Lock_None, undefined, undefined, true);
      await bridgeTokens(bridgeParams1);
      const bridgeParams2 = await setBridgeParams(typesMix.Lock_None, undefined, undefined, true);
      await bridgeTokens(bridgeParams2);
      const bridgeParams3 = await setBridgeParams(typesMix.Lock_None, undefined, undefined, true);
      await bridgeTokens(bridgeParams3);

      const mapInfo = await setMapInfo(Number(bridgeParams3.bridgeParams.mapId), false, true, true);

      const balanceBefore = await hre.ethers.provider.getBalance(BridgeContract.target);

      let totalGasAmount =  bridgeParams1.gasAmount + bridgeParams2.gasAmount + bridgeParams3.gasAmount;
      let totalAmount =  bridgeParams1.bridgeParams.amount + bridgeParams2.bridgeParams.amount + bridgeParams3.bridgeParams.amount;

      expect(balanceBefore - totalGasAmount).to.be.equal(totalAmount);

      let mapId2 = await MapperContract.withdrawAllowedTokens(
          mapInfo.targetChainId,
          mapInfo.originTokenAddress
      );
      mapId2 = 6;
      const mapInfo2: IMapper.MapInfo = await MapperContract.mapInfo(mapId2);

      await expect(
          BridgeContract.withdrawCoinLiquidity({
            recipientAddress: user1.address,
            amount: balanceBefore + 1n,
          })
      ).to.be.revertedWith("Bridge: Contract coins balance must be greater or equal amount");
    });

    it("Should fail withdrawCoinLiquidity Coins if (bool success,) != true", async function () {
      await registerMappings();
      await chargeTokensBridgeContract();
      await chargeCoinsBridgeContract();

      const bridgeParams = await setBridgeParams(typesMix.None_Unlock, undefined, undefined, true);

      const mapInfo = await setMapInfo(Number(bridgeParams.bridgeParams.mapId), false, true, true);

      const balanceBefore = await hre.ethers.provider.getBalance(BridgeContract.target);

      expect(balanceBefore).to.be.equal(bridgeParams.bridgeParams.amount + bridgeParams.gasAmount);

      await expect(
          BridgeContract.withdrawCoinLiquidity({
            recipientAddress: MapperContract.target,
            amount: bridgeParams.bridgeParams.amount,
          })
      ).to.be.revertedWith("Bridge: Failed to send coins");
    });

    it("Should fail withdrawCoinLiquidity when reentrancy attack", async function () {
      const WCLReentrancyAttackContract = await coreDeployment.deployContract(
          IS_LOCALHOST,
          GlobalConfig.TEST_UTILS_ROUTE + "stub/bridge-reentrancy-attack/WCLReentrancyAttack.sol:WCLReentrancyAttack",
          deployer,
          [ await BridgeContract.getAddress() ]
      );
      await registerMappings();
      const bridgeParams1 = await setBridgeParams(typesMix.Lock_None, undefined, undefined, true);
      await bridgeTokens(bridgeParams1);
      const bridgeParams2 = await setBridgeParams(typesMix.Lock_None, undefined, undefined, true);
      await bridgeTokens(bridgeParams2);
      const bridgeParams3 = await setBridgeParams(typesMix.Lock_None, undefined, undefined, true);
      await bridgeTokens(bridgeParams3);

      await BridgeContract.transferOwnership(await WCLReentrancyAttackContract.getAddress());
      await WCLReentrancyAttackContract.acceptOwnership(await BridgeContract.getAddress());

      await expect(
          WCLReentrancyAttackContract.attack()
      ).to.be.revertedWith("Bridge: Failed to send coins");

    });

  });

});
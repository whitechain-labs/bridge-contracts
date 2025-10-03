import hre from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import * as GlobalConfig from "../../utils/GlobalConfig";
import * as ethUtil from "ethereumjs-util";
import * as IBridge from "./interfaces/IBridge";
import * as IMapper from "../mapper/interfaces/IMapper";
import {ErrorDecoder} from 'ethers-decode-error'

chai.use(chaiAsPromised);

describe("BridgeDeployed", function () {

  let MapperContract: any;
  let BridgeContract: any;

  let deployer: any;

  beforeEach(async function () {
    if (hre.network.name === "hardhat") {
      this.skip();
    }
    try {
      let secretKey: string = process.env[`SECRET_KEY`] || "";

      if (secretKey === "") {
        throw new Error("Error: secretKey is empty!");
      }

      deployer = new hre.ethers.Wallet(secretKey, hre.ethers.provider);

      const MAPPER_ADDRESS: string = process.env[`${hre.network.name.toUpperCase()}_MAPPER_ADDRESS`] || "";
      MapperContract = await hre.ethers.getContractAt("contracts/main/modules/mapper/Mapper.sol:Mapper", MAPPER_ADDRESS);

      const BRIDGE_ADDRESS: string = process.env[`${hre.network.name.toUpperCase()}_BRIDGE_ADDRESS`] || "";
      BridgeContract = await hre.ethers.getContractAt(GlobalConfig.BRIDGE_CONTRACT_NAME, BRIDGE_ADDRESS);

    } catch (e) {
      console.log(e);
    }
  });

    async function ECDSAFixture(
        add = deployer.address,
        bridgeParams: IBridge.BridgeParams,
        _mapperContract = MapperContract
    ): Promise<IBridge.ECDSAParams> {
      //const _deadline: bigint = BigInt(await time.latest()) + BigInt(3600);
      const _deadline: bigint = BigInt(Math.floor(Date.now() / 1000)) + BigInt(3600);
      let mapInfo: IMapper.MapInfo = await _mapperContract.mapInfo(bridgeParams.mapId);
      const message = hre.ethers.solidityPackedKeccak256(
          ["address", "address", "bytes32", "bytes32", "uint256", "uint256", "uint256", "uint256", "uint64"],
          [
            deployer.address,
            add,
            hre.ethers.zeroPadValue(bridgeParams.toAddress, 32),
            mapInfo.targetTokenAddress,
            bridgeParams.gasAmount,
            bridgeParams.amount,
            mapInfo.originChainId,
            mapInfo.targetChainId,
            _deadline
          ],
      );
      const messageBuffer = Buffer.from(message.slice(2), "hex");
      const privateKeyBuffer = Buffer.from(GlobalConfig.PRIVATE_KEY_ACC_0.slice(2), "hex");
      const ethMessageHash = ethUtil.hashPersonalMessage(messageBuffer);
      const signature = ethUtil.ecsign(ethMessageHash, privateKeyBuffer);
      const v: bigint = BigInt(signature.v);
      const r = `0x${signature.r.toString("hex")}`;
      const s = `0x${signature.s.toString("hex")}`;

      return ({r, s, deadline: _deadline, v});
    }

  describe("bridgeTokens", async function () {

    it("Should be able to bridgeTokens for Token", async function () {

      const ECDSA = [
        "0x97578bf92248cd8e82a2f3b898de7cd90804bb974501f27e1526ff40b9348abf",
        "0x46907cccaf233e8def622bed673f6bd88716256f8f6ec6596645dc033f8f844e",
        "1741961246",
        "28"
      ];
      const bridgeParams = {
        mapId: 4,
        amount: 1,
        gasAmount: 500,
        toAddress: "0xe1ab2fcA0BCd3D8A14636948890Fb488acdDB600"
      };

      const errorDecoder = ErrorDecoder.create([BridgeContract.interface, MapperContract.interface]);
      try {

        const formattedBridgeParams = {
          ...bridgeParams,
          gasAmount: bridgeParams.gasAmount.toString()
        };

        try {
          await hre.network.provider.send("eth_estimateGas", [
                {
                  from: deployer.address,
                  to: BridgeContract.target,
                  value: bridgeParams.gasAmount.toString(),
                  data: BridgeContract.interface.encodeFunctionData("bridgeTokens", [[formattedBridgeParams, ECDSA]])
                }
              ])

        } catch (error: any) {
            console.error(error.data);
            const { name, data, args } = await errorDecoder.decode(error)
            console.error({name});
            console.error({args});
        }

      } catch (error) {
        console.error("Error during bridgeTokens:", error);
      }

    });
  });
});
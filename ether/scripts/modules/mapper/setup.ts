import * as hre from 'hardhat';
import * as GlobalConfig from "../../../test/utils/GlobalConfig";
import { Mapper } from "../../../typechain-types";
import * as UtilsConfig from "./utils/config";
import * as Config from "../../../ignition/core/config";
import { _getTicker } from "../../../ignition/core/deployment";
import { MapInfo } from "./interfaces/IMapper";
import console from "node:console";
import bs58 from "bs58";

let deployer: any;
let MapperContract: any;
let mapperParams: MapInfo[];

async function main() {
  let mapperAddress = process.env[`${hre.network.name.toUpperCase()}_MAPPER_ADDRESS`] || "";
  if (!mapperAddress || mapperAddress.trim() === "") {
    throw new Error(`Error: Environment variable ${hre.network.name.toUpperCase()}_MAPPER_ADDRESS is not set or empty`);
  }

  MapperContract = await contractLoader<Mapper>(GlobalConfig.MAPPER_CONTRACT_NAME);
  let startBalance = await getDeployerBalance();

  if (hre.network.name == Config.NETWORK_MAINNET) {
    mapperParams = UtilsConfig.MainnetMapperRoutes();
  } else if (hre.network.name == Config.NETWORK_SEPOLIA) {
    mapperParams = UtilsConfig.SepoliaMapperRoutes();
  } else if (hre.network.name == Config.NETWORK_WHITECHAIN) {
    mapperParams = UtilsConfig.WhitechainMapperRoutes();
  } else if (hre.network.name == Config.NETWORK_WHITECHAINTESTNET) {
    mapperParams = UtilsConfig.WhitechainTestnetMapperRoutes();
  } else if (hre.network.name == Config.NETWORK_WHITECHAINDEVNET) {
    mapperParams = UtilsConfig.WhitechainDevnetMapperRoutes();
  } else {
    throw new Error(`Network not supported: ${hre.network.name}`);
  }

  if (mapperParams.length == 0) {
    throw new Error(`Error: mapperParams is empty`);
  }

  let registerMappingParams = formatParams(mapperParams);

  await registerMapping(registerMappingParams, MapperContract);

  let endBalance = await getDeployerBalance(false);
  console.log(`Account: ${deployer.address} - GasFee: ${hre.ethers.formatEther(startBalance - endBalance)} ${_getTicker(hre.network.name)}`);
}

async function registerMapping(initParams: MapInfo[], Contract: any) {
  const results: {
    index: number;
    txHash?: string;
    status: 'success' | 'error';
    error?: string;
  }[] = [];

  for (let i = 0; i < initParams.length; i++) {
    const params = initParams[i];

    try {
      console.log("🔍 MapperContract loaded:", await Contract?.getAddress());

      const tx = await Contract.registerMapping(params);

      console.log(`🚀 Sent tx hash: ${tx.hash}`);
      await tx.wait();

      results.push({
        index: i,
        txHash: tx.hash,
        status: 'success',
      });
      console.log(`✅ Success sending`);
      await getDeployerBalance();

    } catch (err: any) {
      console.error(`❌ Error sending:`, err.message);
      results.push({
        index: i,
        status: 'error',
        error: err.message,
      });
    }
  }
}

async function contractLoader<T>(contractName: string): Promise<T> {
  if (hre.network.name === "hardhat") {
    throw new Error("Error: network is incorrect");
  }

  let secretKey: string = process.env[`SECRET_KEY`] || "";

  if (secretKey === "") {
    throw new Error("Error: secretKey is empty!");
  }

  deployer = new hre.ethers.Wallet(secretKey, hre.ethers.provider);

  const CONTRACT_ADDRESS: string = process.env[`${hre.network.name.toUpperCase()}_${contractName.toUpperCase()}_ADDRESS`] || "";
  if (CONTRACT_ADDRESS === "") {
    throw new Error(`Error: ${hre.network.name.toUpperCase()}_${contractName.toUpperCase()}_ADDRESS is empty!`);
  }

  let Factory = await hre.ethers.getContractFactory(
      GlobalConfig.MAIN_UTILS_ROUTE + "mapper/" + contractName + ".sol:" + contractName,
      deployer
  );
  return Factory.attach(CONTRACT_ADDRESS) as unknown as T;
}

async function getDeployerBalance(view: boolean = true): Promise<bigint> {
  const adminCoinsBalance = await hre.ethers.provider.getBalance(deployer.address);

  if (view) {
    console.log(
      `Account: ${deployer.address} - Balance: ${hre.ethers.formatEther(adminCoinsBalance)} ${_getTicker(hre.network.name)}`
    );
  }

  return adminCoinsBalance;
}

function formatParams(initParams: MapInfo[]): MapInfo[] {

  for (let i = 0; i < initParams.length; i++) {
    const originTokenAddressBytes20 = addressTo20Bytes(initParams[i].originTokenAddress);
    const targetTokenAddressBytes20 = addressTo20Bytes(initParams[i].targetTokenAddress);
    const originTokenAddressHex20 = hre.ethers.hexlify(originTokenAddressBytes20);
    const targetTokenAddressHex20 = hre.ethers.hexlify(targetTokenAddressBytes20);
    initParams[i].originTokenAddress = hre.ethers.zeroPadValue(originTokenAddressHex20, 32);
    initParams[i].targetTokenAddress = hre.ethers.zeroPadValue(targetTokenAddressHex20, 32);
  }

  return initParams;
}

function addressTo20Bytes(input: string): Uint8Array {
  const s = input.trim();

  if (hre.ethers.isAddress(s)) {
    const checksummed = hre.ethers.getAddress(s);
    return hre.ethers.getBytes(checksummed);
  }

  try {
    const decoded = bs58.decode(s);
    if (decoded.length !== 25) {
      throw new Error("Error: Invalid TRON address length");
    }
    return decoded.slice(1, 21);
  } catch {
    throw new Error("Error: Unsupported address format. Expect EVM 0x... or TRON Base58.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
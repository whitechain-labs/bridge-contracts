import {time} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";

export const TEST_UTILS_ROUTE = 'contracts/tests/modules/utils/';
export const MAIN_UTILS_ROUTE = 'contracts/main/modules/';
export const EXAMPLE_TOKEN_CONTRACT_NAME = 'ExampleToken';
export const EXAMPLE_UUPS_TOKEN_CONTRACT_NAME = 'ExampleUUPSToken';

export const MAPPER_CONTRACT_NAME = "Mapper";
export const MAPPER_TEST_CONTRACT_NAME = "MapperTest";
export const BRIDGE_CONTRACT_NAME = "Bridge";
export const BRIDGE_TEST_CONTRACT_NAME = "BridgeTest";

export const MINUT_1: number = 60;
export const DAY_1: number = 86400;
export const MONTH_1: number = 2592000;
export const PERCENT_100: bigint = BigInt(100);

export const HARDHAT_ID = 1337;
export const ETHEREUM_MAINNET_ID = 1;
export const ETHEREUM_SEPOLIA_ID = 11155111;
export const WHITECHAIN_MAINNET_ID = 1875;
export const WHITECHAIN_TESTNET_ID = 2625;
export const WHITECHAIN_DEVNET_ID = 1000001000;
export const TRON_NILE_ID = 3448148188;
export const TRON_MAINNET_ID = 728126428;

export const ETHER_1: bigint = hre.ethers.parseEther("1"); //1 ether
export const ETHER_10: bigint = hre.ethers.parseEther("10"); //10 ether
export const ETHER_100: bigint = hre.ethers.parseEther("100"); //100 ether
export const ETHER_1000: bigint = hre.ethers.parseEther("1000"); //1000 ether
export const ETHER_10_000: bigint = hre.ethers.parseEther("10000"); //10000 ether

export const USDT_1: bigint = hre.ethers.parseUnits("1", 6); //1 USDT
export const USDT_10: bigint = hre.ethers.parseUnits("10", 6); //10 USDT
export const USDT_100: bigint = hre.ethers.parseUnits("100", 6); //100 USDT
export const USDT_1000: bigint = hre.ethers.parseUnits("1000", 6); //1000 USDT
export const USDT_10_000: bigint = hre.ethers.parseUnits("10000", 6); //10000 USDT

export const PRIVATE_KEY_ACC_0: string = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
export const PRIVATE_KEY_ACC_1: string = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
export const PRIVATE_KEY_ACC_2: string = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
export const PRIVATE_KEY_ACC_3: string = '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6';
export const PRIVATE_KEY_ACC_4: string = '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a';
export const PRIVATE_KEY_ACC_5: string = '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba';

export const nowTime = async function ():Promise<any> {
    return await time.latest();
}


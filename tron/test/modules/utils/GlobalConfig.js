const { ethers } = require("ethers");

const MINUT_1 = 60;
const DAY_1 = 86400;
const MONTH_1 = 2592000;

const PERCENT_100 = BigInt(100);

const HARDHAT_ID = 1337;
const ETHEREUM_MAINNET_ID = 1;
const ETHEREUM_SEPOLIA_ID = 11155111;
const WHITECHAIN_MAINNET_ID = 1875;
const WHITECHAIN_TESTNET_ID = 2625;
const WHITECHAIN_DEVNET_ID = 1000001000;
const TRON_NILE_ID = 3448148188;
const TRON_MAINNET_ID = 728126428;

const ETHER_1 = ethers.parseEther("1"); //1 ether
const ETHER_10 = ethers.parseEther("10"); //10 ether
const ETHER_100 = ethers.parseEther("100"); //100 ether
const ETHER_1000 = ethers.parseEther("1000"); //1000 ether
const ETHER_10_000 = ethers.parseEther("10000"); //10000 ether

const USDT_05 = ethers.parseUnits("5", 5); //0.5 USDT
const USDT_1 = ethers.parseUnits("1", 6); //1 USDT
const USDT_10 = ethers.parseUnits("10", 6); //10 USDT
const USDT_100 = ethers.parseUnits("100", 6); //100 USDT
const USDT_1000 = ethers.parseUnits("1000", 6); //1000 USDT
const USDT_10_000 = ethers.parseUnits("10000", 6); //10000 USDT

module.exports = {
    MINUT_1,
    DAY_1,
    MONTH_1,
    PERCENT_100,
    HARDHAT_ID,
    ETHEREUM_MAINNET_ID,
    ETHEREUM_SEPOLIA_ID,
    WHITECHAIN_MAINNET_ID,
    WHITECHAIN_TESTNET_ID,
    WHITECHAIN_DEVNET_ID,
    TRON_NILE_ID,
    TRON_MAINNET_ID,
    ETHER_1,
    ETHER_10,
    ETHER_100,
    ETHER_1000,
    ETHER_10_000,
    USDT_05,
    USDT_1,
    USDT_10,
    USDT_100,
    USDT_1000,
    USDT_10_000
};


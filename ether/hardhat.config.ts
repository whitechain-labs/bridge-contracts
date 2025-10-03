import {HardhatUserConfig} from "hardhat/config";
import 'dotenv/config'
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-verify";
import "solidity-coverage";
import 'solidity-docgen';

const accounts: string[] = [process.env.SECRET_KEY || '0000000000000000000000000000000000000000000000000000000000000000'];

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      chainId: 1337
    },
    mainnet: {
      url: process.env.MAINNET_RPC_PROVIDER || '',
      accounts,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_PROVIDER || '',
      accounts,
    },
    whitechain: {
      url: process.env.WHITECHAIN_RPC_PROVIDER || '',
      chainId: 1875,
      accounts,
    },
    whitechainTestnet: {
      url: process.env.WHITECHAINTESTNET_RPC_PROVIDER || '',
      chainId: 2625,
      accounts,
    },
    whitechainDevnet: {
      url: process.env.WHITECHAINDEVNET_RPC_PROVIDER || '',
      chainId: 1000001000,
      accounts,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.30",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          }
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  },
  sourcify: {
    enabled: false
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.MAINNET_API_KEY || '',
      sepolia: process.env.SEPOLIA_API_KEY || '',
    },
    customChains: [
      {
        network: "whitechain",
        chainId: 1875,
        urls: {
          apiURL: "",
          browserURL: ""
        }
      },
      {
        network: "whitechainTestnet",
        chainId: 2625,
        urls: {
          apiURL: "",
          browserURL: ""
        }
      },
      {
        network: "whitechainDevnet",
        chainId: 1000001000,
        urls: {
          apiURL: "",
          browserURL: ""
        }
      },

    ]
  },
  docgen: {
    pages: 'files',
    exclude: [
        "tests",
        "main/interfaces",
        "main/libraries"
    ],
    templates: 'docs/templates/public',
  }
};

export default config;

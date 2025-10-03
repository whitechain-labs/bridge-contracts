import {DepositType, MapInfo, WithdrawType} from "../interfaces/IMapper";
import * as GlobalConfig from "../../../../test/utils/GlobalConfig";

export const MainnetMapperRoutes = (): MapInfo[] => [
// Bridge Mainnet >>> Whitechain USDT
  {
    originChainId: GlobalConfig.ETHEREUM_MAINNET_ID.toString(),
    targetChainId: GlobalConfig.WHITECHAIN_MAINNET_ID.toString(),
    depositType: DepositType.Lock,
    withdrawType: WithdrawType.None,
    originTokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // Mainnet USDT
    targetTokenAddress: "0xF95604a4034d8407d3F1256De56C9ae37F299cb8", // Whitechain USDT
    useTransfer: false,
    isAllowed: true,
    isCoin: false
  },
  // Bridge Mainnet >>> Whitechain USDC
  {
    originChainId: GlobalConfig.ETHEREUM_MAINNET_ID.toString(),
    targetChainId: GlobalConfig.WHITECHAIN_MAINNET_ID.toString(),
    depositType: DepositType.Lock,
    withdrawType: WithdrawType.None,
    originTokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // Mainnet USDC
    targetTokenAddress: "0xF97B9Bf62916f1EB42Dd906a7254603e7b9FC4a7", // Whitechain USDC
    useTransfer: false,
    isAllowed: true,
    isCoin: false
  },
  // Bridge Mainnet >>> Whitechain WBT
  {
    originChainId: GlobalConfig.ETHEREUM_MAINNET_ID.toString(),
    targetChainId: GlobalConfig.WHITECHAIN_MAINNET_ID.toString(),
    depositType: DepositType.Lock,
    withdrawType: WithdrawType.None,
    originTokenAddress: "0x925206b8a707096Ed26ae47C84747fE0bb734F59", // Mainnet WBT
    targetTokenAddress: "0xb044a2a1e3C3deb17e3602bF088811d9bDc762EA", // Whitechain WWBT
    useTransfer: false,
    isAllowed: true,
    isCoin: false
  },
  // Receive Mainnet <<< Whitechain USDT
  {
    originChainId: GlobalConfig.WHITECHAIN_MAINNET_ID.toString(),
    targetChainId: GlobalConfig.ETHEREUM_MAINNET_ID.toString(),
    depositType: DepositType.None,
    withdrawType: WithdrawType.Unlock,
    originTokenAddress: "0xF95604a4034d8407d3F1256De56C9ae37F299cb8", // Whitechain USDT
    targetTokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // Mainnet USDT
    useTransfer: false,
    isAllowed: true,
    isCoin: false
  },
  // Receive Mainnet <<< Whitechain USDC
  {
    originChainId: GlobalConfig.WHITECHAIN_MAINNET_ID.toString(),
    targetChainId: GlobalConfig.ETHEREUM_MAINNET_ID.toString(),
    depositType: DepositType.None,
    withdrawType: WithdrawType.Unlock,
    originTokenAddress: "0xF97B9Bf62916f1EB42Dd906a7254603e7b9FC4a7", // Whitechain USDC
    targetTokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // Mainnet USDC
    useTransfer: false,
    isAllowed: true,
    isCoin: false
  },
  // Receive Mainnet <<< Whitechain WBT
  {
    originChainId: GlobalConfig.WHITECHAIN_MAINNET_ID.toString(),
    targetChainId: GlobalConfig.ETHEREUM_MAINNET_ID.toString(),
    depositType: DepositType.None,
    withdrawType: WithdrawType.Unlock,
    originTokenAddress: "0xb044a2a1e3C3deb17e3602bF088811d9bDc762EA", // Whitechain WWBT
    targetTokenAddress: "0x925206b8a707096Ed26ae47C84747fE0bb734F59", // Mainnet WBT
    useTransfer: false,
    isAllowed: true,
    isCoin: false
  }
];

export const SepoliaMapperRoutes = (): MapInfo[] => [
  // Bridge Sepolia >>> Whitechain Testnet USDT
  {
    originChainId: GlobalConfig.ETHEREUM_SEPOLIA_ID.toString(),
    targetChainId: GlobalConfig.WHITECHAIN_TESTNET_ID.toString(),
    depositType: DepositType.Lock,
    withdrawType: WithdrawType.None,
    originTokenAddress: "0x11101b4a88093bebbd901be8cf398f64714a7009",
    targetTokenAddress: "0xb029c90b1642b507ba924bfc8cbc2826dc19ec4b",
    useTransfer: false,
    isAllowed: true,
    isCoin: false
  },
  // Bridge Sepolia >>> Whitechain Testnet USDC
  {
    originChainId: GlobalConfig.ETHEREUM_SEPOLIA_ID.toString(),
    targetChainId: GlobalConfig.WHITECHAIN_TESTNET_ID.toString(),
    depositType: DepositType.Lock,
    withdrawType: WithdrawType.None,
    originTokenAddress: "0x91b2e38c9b9acf8ef2b2c549bf7f86ff5b0108fd",
    targetTokenAddress: "0x4320bdf56a5e84c631a990b51c489b9410b7a6cd",
    useTransfer: false,
    isAllowed: true,
    isCoin: false
  },
  // Bridge Sepolia >>> Whitechain Testnet WBT
  {
    originChainId: GlobalConfig.ETHEREUM_SEPOLIA_ID.toString(),
    targetChainId: GlobalConfig.WHITECHAIN_TESTNET_ID.toString(),
    depositType: DepositType.Lock,
    withdrawType: WithdrawType.None,
    originTokenAddress: "0x3c6bf6821d5cc721f6bf41490b0d2a6963d2b031",
    targetTokenAddress: "0x1cd97ab75c1ffdfda5a231ee9626deec7d46165b",
    useTransfer: false,
    isAllowed: true,
    isCoin: false
  },
  // Receive Sepolia <<< Whitechain Testnet USDT
  {
    originChainId: GlobalConfig.WHITECHAIN_TESTNET_ID.toString(),
    targetChainId: GlobalConfig.ETHEREUM_SEPOLIA_ID.toString(),
    depositType: DepositType.None,
    withdrawType: WithdrawType.Unlock,
    originTokenAddress: "0xb029c90b1642b507ba924bfc8cbc2826dc19ec4b",
    targetTokenAddress: "0x11101b4a88093bebbd901be8cf398f64714a7009",
    useTransfer: false,
    isAllowed: true,
    isCoin: false
  },
  // Receive Sepolia <<< Whitechain Testnet USDC
  {
    originChainId: GlobalConfig.WHITECHAIN_TESTNET_ID.toString(),
    targetChainId: GlobalConfig.ETHEREUM_SEPOLIA_ID.toString(),
    depositType: DepositType.None,
    withdrawType: WithdrawType.Unlock,
    originTokenAddress: "0x4320bdf56a5e84c631a990b51c489b9410b7a6cd",
    targetTokenAddress: "0x91b2e38c9b9acf8ef2b2c549bf7f86ff5b0108fd",
    useTransfer: false,
    isAllowed: true,
    isCoin: false
  },
  // Receive Sepolia <<< Whitechain Testnet WBT
  {
    originChainId: GlobalConfig.WHITECHAIN_TESTNET_ID.toString(),
    targetChainId: GlobalConfig.ETHEREUM_SEPOLIA_ID.toString(),
    depositType: DepositType.None,
    withdrawType: WithdrawType.Unlock,
    originTokenAddress: "0x1cd97ab75c1ffdfda5a231ee9626deec7d46165b",
    targetTokenAddress: "0x3c6bf6821d5cc721f6bf41490b0d2a6963d2b031",
    useTransfer: false,
    isAllowed: true,
    isCoin: false
  }
];

export const WhitechainMapperRoutes = (): MapInfo[] => [
  // Bridge Whitechain >>> Mainnet USDT
  {
    originChainId: GlobalConfig.WHITECHAIN_MAINNET_ID.toString(),
    targetChainId: GlobalConfig.ETHEREUM_MAINNET_ID.toString(),
    depositType: DepositType.Lock,
    withdrawType: WithdrawType.None,
    originTokenAddress: "0xF95604a4034d8407d3F1256De56C9ae37F299cb8", // Whitechain USDT
    targetTokenAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7", // Mainnet USDT
    useTransfer: false,
    isAllowed: true,
    isCoin: false,
  },
  // Bridge Whitechain >>> Mainnet USDC
  {
    originChainId: GlobalConfig.WHITECHAIN_MAINNET_ID.toString(),
    targetChainId: GlobalConfig.ETHEREUM_MAINNET_ID.toString(),
    depositType: DepositType.Lock,
    withdrawType: WithdrawType.None,
    originTokenAddress: "0xF97B9Bf62916f1EB42Dd906a7254603e7b9FC4a7", // Whitechain USDC
    targetTokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // Mainnet USDC
    useTransfer: false,
    isAllowed: true,
    isCoin: false,
  },
  // Bridge Whitechain >>> Mainnet WBT
  {
    originChainId: GlobalConfig.WHITECHAIN_MAINNET_ID.toString(),
    targetChainId: GlobalConfig.ETHEREUM_MAINNET_ID.toString(),
    depositType: DepositType.Lock,
    withdrawType: WithdrawType.None,
    originTokenAddress: "0xb044a2a1e3C3deb17e3602bF088811d9bDc762EA", // Whitechain WWBT
    targetTokenAddress: "0x925206b8a707096Ed26ae47C84747fE0bb734F59", // Mainnet WBT
    useTransfer: false,
    isAllowed: true,
    isCoin: true,
  },
  // Bridge Whitechain >>> Tron USDT
  {
    originChainId: GlobalConfig.WHITECHAIN_MAINNET_ID.toString(),
    targetChainId: GlobalConfig.TRON_MAINNET_ID.toString(),
    depositType: DepositType.Lock,
    withdrawType: WithdrawType.None,
    originTokenAddress: "0xF95604a4034d8407d3F1256De56C9ae37F299cb8", // Whitechain USDT
    targetTokenAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", // Tron USDT
    useTransfer: false,
    isAllowed: true,
    isCoin: false,
  },
  // Bridge Whitechain >>> Tron WBT
  {
    originChainId: GlobalConfig.WHITECHAIN_MAINNET_ID.toString(),
    targetChainId: GlobalConfig.TRON_MAINNET_ID.toString(),
    depositType: DepositType.Lock,
    withdrawType: WithdrawType.None,
    originTokenAddress: "0xb044a2a1e3C3deb17e3602bF088811d9bDc762EA", // Whitechain WWBT
    targetTokenAddress: "TFptbWaARrWTX5Yvy3gNG5Lm8BmhPx82Bt", // Tron WBT
    useTransfer: false,
    isAllowed: true,
    isCoin: true,
  },
  // Receive Whitechain <<< Mainnet USDT
  {
    originChainId: GlobalConfig.ETHEREUM_MAINNET_ID.toString(),
    targetChainId: GlobalConfig.WHITECHAIN_MAINNET_ID.toString(),
    depositType: DepositType.None,
    withdrawType: WithdrawType.Unlock,
    originTokenAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7", // Mainnet USDT
    targetTokenAddress: "0xF95604a4034d8407d3F1256De56C9ae37F299cb8", // Whitechain USDT
    useTransfer: false,
    isAllowed: true,
    isCoin: false,
  },
  // Receive Whitechain <<< Mainnet USDC
  {
    originChainId: GlobalConfig.ETHEREUM_MAINNET_ID.toString(),
    targetChainId: GlobalConfig.WHITECHAIN_MAINNET_ID.toString(),
    depositType: DepositType.None,
    withdrawType: WithdrawType.Unlock,
    originTokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // Mainnet USDC
    targetTokenAddress: "0xF97B9Bf62916f1EB42Dd906a7254603e7b9FC4a7", // Whitechain USDC
    useTransfer: false,
    isAllowed: true,
    isCoin: false,
  },
  // Receive Whitechain <<< Mainnet WBT
  {
    originChainId: GlobalConfig.ETHEREUM_MAINNET_ID.toString(),
    targetChainId: GlobalConfig.WHITECHAIN_MAINNET_ID.toString(),
    depositType: DepositType.None,
    withdrawType: WithdrawType.Unlock,
    originTokenAddress: "0x925206b8a707096Ed26ae47C84747fE0bb734F59", // Mainnet WBT
    targetTokenAddress: "0xb044a2a1e3C3deb17e3602bF088811d9bDc762EA", // Whitechain WWBT
    useTransfer: false,
    isAllowed: true,
    isCoin: true,
  },
  // Receive Whitechain <<< Tron USDT
  {
    originChainId: GlobalConfig.TRON_MAINNET_ID.toString(),
    targetChainId: GlobalConfig.WHITECHAIN_MAINNET_ID.toString(),
    depositType: DepositType.None,
    withdrawType: WithdrawType.Unlock,
    originTokenAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", // Tron USDT
    targetTokenAddress: "0xF95604a4034d8407d3F1256De56C9ae37F299cb8", // Whitechain USDT
    useTransfer: false,
    isAllowed: true,
    isCoin: false,
  },
  // Receive Whitechain <<< Tron WBT
  {
    originChainId: GlobalConfig.TRON_MAINNET_ID.toString(),
    targetChainId: GlobalConfig.WHITECHAIN_MAINNET_ID.toString(),
    depositType: DepositType.None,
    withdrawType: WithdrawType.Unlock,
    originTokenAddress: "TFptbWaARrWTX5Yvy3gNG5Lm8BmhPx82Bt", // Tron WBT
    targetTokenAddress: "0xb044a2a1e3C3deb17e3602bF088811d9bDc762EA", // Whitechain WWBT
    useTransfer: false,
    isAllowed: true,
    isCoin: true,
  }
];

export const WhitechainTestnetMapperRoutes = (): MapInfo[] => [
  // Bridge Whitechain Testnet >>> Sepolia USDT
  {
    originChainId: GlobalConfig.WHITECHAIN_TESTNET_ID.toString(),
    targetChainId: GlobalConfig.ETHEREUM_SEPOLIA_ID.toString(),
    depositType: DepositType.Lock,
    withdrawType: WithdrawType.None,
    originTokenAddress: "0xb029c90b1642b507ba924bfc8cbc2826dc19ec4b",
    targetTokenAddress: "0x11101b4a88093bebbd901be8cf398f64714a7009",
    useTransfer: false,
    isAllowed: true,
    isCoin: false,
  },
  // Bridge Whitechain Testnet >>> Sepolia USDC
  {
    originChainId: GlobalConfig.WHITECHAIN_TESTNET_ID.toString(),
    targetChainId: GlobalConfig.ETHEREUM_SEPOLIA_ID.toString(),
    depositType: DepositType.Lock,
    withdrawType: WithdrawType.None,
    originTokenAddress: "0x4320bdf56a5e84c631a990b51c489b9410b7a6cd",
    targetTokenAddress: "0x91b2e38c9b9acf8ef2b2c549bf7f86ff5b0108fd",
    useTransfer: false,
    isAllowed: true,
    isCoin: false,
  },
  // Bridge Whitechain Testnet >>> Sepolia WBT
  {
    originChainId: GlobalConfig.WHITECHAIN_TESTNET_ID.toString(),
    targetChainId: GlobalConfig.ETHEREUM_SEPOLIA_ID.toString(),
    depositType: DepositType.Lock,
    withdrawType: WithdrawType.None,
    originTokenAddress: "0x1cd97ab75c1ffdfda5a231ee9626deec7d46165b",
    targetTokenAddress: "0x3c6bf6821d5cc721f6bf41490b0d2a6963d2b031",
    useTransfer: false,
    isAllowed: true,
    isCoin: true,
  },
  // Bridge Whitechain Testnet >>> Tron Nile USDT
  {
    originChainId: GlobalConfig.WHITECHAIN_TESTNET_ID.toString(),
    targetChainId: GlobalConfig.TRON_NILE_ID.toString(),
    depositType: DepositType.Lock,
    withdrawType: WithdrawType.None,
    originTokenAddress: "0xb029c90b1642b507ba924bfc8cbc2826dc19ec4b",
    targetTokenAddress: "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf",
    useTransfer: false,
    isAllowed: true,
    isCoin: false,
  },
  // Bridge Whitechain Testnet >>> Tron Nile WBT
  {
    originChainId: GlobalConfig.WHITECHAIN_TESTNET_ID.toString(),
    targetChainId: GlobalConfig.TRON_NILE_ID.toString(),
    depositType: DepositType.Lock,
    withdrawType: WithdrawType.None,
    originTokenAddress: "0x1cd97ab75c1ffdfda5a231ee9626deec7d46165b",
    targetTokenAddress: "TGa8yeUzkCmuajSedYoPiA9bA8YBnvXvEL",
    useTransfer: false,
    isAllowed: true,
    isCoin: true,
  },
  // Receive Whitechain Testnet <<< Sepolia USDT
  {
    originChainId: GlobalConfig.ETHEREUM_SEPOLIA_ID.toString(),
    targetChainId: GlobalConfig.WHITECHAIN_TESTNET_ID.toString(),
    depositType: DepositType.None,
    withdrawType: WithdrawType.Unlock,
    originTokenAddress: "0x11101b4a88093bebbd901be8cf398f64714a7009",
    targetTokenAddress: "0xb029c90b1642b507ba924bfc8cbc2826dc19ec4b",
    useTransfer: false,
    isAllowed: true,
    isCoin: false,
  },
  // Receive Whitechain Testnet <<< Sepolia USDC
  {
    originChainId: GlobalConfig.ETHEREUM_SEPOLIA_ID.toString(),
    targetChainId: GlobalConfig.WHITECHAIN_TESTNET_ID.toString(),
    depositType: DepositType.None,
    withdrawType: WithdrawType.Unlock,
    originTokenAddress: "0x91b2e38c9b9acf8ef2b2c549bf7f86ff5b0108fd",
    targetTokenAddress: "0x4320bdf56a5e84c631a990b51c489b9410b7a6cd",
    useTransfer: false,
    isAllowed: true,
    isCoin: false,
  },
  // Receive Whitechain Testnet <<< Sepolia WBT
  {
    originChainId: GlobalConfig.ETHEREUM_SEPOLIA_ID.toString(),
    targetChainId: GlobalConfig.WHITECHAIN_TESTNET_ID.toString(),
    depositType: DepositType.None,
    withdrawType: WithdrawType.Unlock,
    originTokenAddress: "0x3c6bf6821d5cc721f6bf41490b0d2a6963d2b031",
    targetTokenAddress: "0x1cd97ab75c1ffdfda5a231ee9626deec7d46165b",
    useTransfer: false,
    isAllowed: true,
    isCoin: true,
  },
  // Receive Whitechain Testnet <<< Tron Nile USDT
  {
    originChainId: GlobalConfig.TRON_NILE_ID.toString(),
    targetChainId: GlobalConfig.WHITECHAIN_TESTNET_ID.toString(),
    depositType: DepositType.None,
    withdrawType: WithdrawType.Unlock,
    originTokenAddress: "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf",
    targetTokenAddress: "0xb029c90b1642b507ba924bfc8cbc2826dc19ec4b",
    useTransfer: false,
    isAllowed: true,
    isCoin: false,
  },
  // Receive Whitechain Testnet <<< Tron Nile WBT
  {
    originChainId: GlobalConfig.TRON_NILE_ID.toString(),
    targetChainId: GlobalConfig.WHITECHAIN_TESTNET_ID.toString(),
    depositType: DepositType.None,
    withdrawType: WithdrawType.Unlock,
    originTokenAddress: "TGa8yeUzkCmuajSedYoPiA9bA8YBnvXvEL",
    targetTokenAddress: "0x1cd97ab75c1ffdfda5a231ee9626deec7d46165b",
    useTransfer: false,
    isAllowed: true,
    isCoin: true,
  }
];

export const WhitechainDevnetMapperRoutes = (): MapInfo[] => [];
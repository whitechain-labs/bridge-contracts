const GlobalConfig = require("../../test/modules/utils/GlobalConfig");

const NETWORK_MAINNET = 'mainnet';
const NETWORK_NILE = 'nile';


/*
 * @notice Enum representing the type of deposit.
 * Used to specify how tokens are handled during deposit.
 * - `None`: No deposit allowed.
 * - `Lock`: Tokens are locked in the contract.
 * - `Burn`: Tokens are burned from the user's balance.
 */
const DepositType = {
  None: 0,
  Lock: 1,
  Burn: 2
}

/*
 * @notice Enum representing the type of withdrawal.
 * Used to specify how tokens are handled during withdrawal.
 * - `None`: No withdrawal allowed.
 * - `Unlock`: Tokens are unlocked from the contract.
 * - `Mint`: New tokens are minted on the target chain.
 */
const WithdrawType = {
  None: 0,
  Unlock: 1,
  Mint: 2
}

const MainnetMapperRoutes = [
  // Bridge Tron >>> Whitechain USDT
  {
    originChainId: GlobalConfig.TRON_MAINNET_ID,
    targetChainId: GlobalConfig.WHITECHAIN_MAINNET_ID,
    depositType: DepositType.Lock,
    withdrawType: WithdrawType.None,
    originTokenAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", // Tron USDT
    targetTokenAddress: "0xF95604a4034d8407d3F1256De56C9ae37F299cb8", // Whitechain USDT
    useTransfer: true,
    isAllowed: true,
    isCoin: false
  },
  // Bridge Tron >>> Whitechain WBT
  {
    originChainId: GlobalConfig.TRON_MAINNET_ID,
    targetChainId: GlobalConfig.WHITECHAIN_MAINNET_ID,
    depositType: DepositType.Lock,
    withdrawType: WithdrawType.None,
    originTokenAddress: "TFptbWaARrWTX5Yvy3gNG5Lm8BmhPx82Bt", // Tron WBT
    targetTokenAddress: "0xb044a2a1e3C3deb17e3602bF088811d9bDc762EA", // Whitechain WWBT
    useTransfer: false,
    isAllowed: true,
    isCoin: false
  },
  // Receive Tron <<< Whitechain USDT
  {
    originChainId: GlobalConfig.WHITECHAIN_MAINNET_ID,
    targetChainId: GlobalConfig.TRON_MAINNET_ID,
    depositType: DepositType.None,
    withdrawType: WithdrawType.Unlock,
    originTokenAddress: "0xF95604a4034d8407d3F1256De56C9ae37F299cb8", // Whitechain USDT
    targetTokenAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", // Tron USDT
    useTransfer: true,
    isAllowed: true,
    isCoin: false
  },
  // Receive Tron <<< Whitechain WBT
  {
    originChainId: GlobalConfig.WHITECHAIN_MAINNET_ID,
    targetChainId: GlobalConfig.TRON_MAINNET_ID,
    depositType: DepositType.None,
    withdrawType: WithdrawType.Unlock,
    originTokenAddress: "0xb044a2a1e3C3deb17e3602bF088811d9bDc762EA", // Whitechain WWBT
    targetTokenAddress: "TFptbWaARrWTX5Yvy3gNG5Lm8BmhPx82Bt", // Tron WBT
    useTransfer: false,
    isAllowed: true,
    isCoin: false
  }
];

const NileMapperRoutes = [
  // Bridge Tron Nile >>> Whitechain Testnet USDT
  {
    originChainId: GlobalConfig.TRON_NILE_ID,
    targetChainId: GlobalConfig.WHITECHAIN_TESTNET_ID,
    depositType: DepositType.Lock,
    withdrawType: WithdrawType.None,
    originTokenAddress: "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf",
    targetTokenAddress: "0xb029c90B1642B507bA924BFC8CBc2826dc19Ec4b",
    useTransfer: true,
    isAllowed: true,
    isCoin: false
  },
  // Bridge Tron Nile >>> Whitechain Testnet WBT
  {
    originChainId: GlobalConfig.TRON_NILE_ID,
    targetChainId: GlobalConfig.WHITECHAIN_TESTNET_ID,
    depositType: DepositType.Lock,
    withdrawType: WithdrawType.None,
    originTokenAddress: "TGa8yeUzkCmuajSedYoPiA9bA8YBnvXvEL",
    targetTokenAddress: "0x1CD97Ab75c1ffDFda5a231EE9626dEeC7D46165b",
    useTransfer: false,
    isAllowed: true,
    isCoin: false
  },
  // Receive Tron Nile <<< Whitechain Testnet USDT
  {
    originChainId: GlobalConfig.WHITECHAIN_TESTNET_ID,
    targetChainId: GlobalConfig.TRON_NILE_ID,
    depositType: DepositType.None,
    withdrawType: WithdrawType.Unlock,
    originTokenAddress: "0xb029c90B1642B507bA924BFC8CBc2826dc19Ec4b",
    targetTokenAddress: "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf",
    useTransfer: true,
    isAllowed: true,
    isCoin: false
  },
  // Receive Tron Nile <<< Whitechain Testnet WBT
  {
    originChainId: GlobalConfig.WHITECHAIN_TESTNET_ID,
    targetChainId: GlobalConfig.TRON_NILE_ID,
    depositType: DepositType.None,
    withdrawType: WithdrawType.Unlock,
    originTokenAddress: "0x1CD97Ab75c1ffDFda5a231EE9626dEeC7D46165b",
    targetTokenAddress: "TGa8yeUzkCmuajSedYoPiA9bA8YBnvXvEL",
    useTransfer: false,
    isAllowed: true,
    isCoin: false
  }
];

module.exports = {
  NETWORK_MAINNET,
  NETWORK_NILE,
  MainnetMapperRoutes,
  NileMapperRoutes
};
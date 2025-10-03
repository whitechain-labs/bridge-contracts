/**
 * @notice Enum representing the type of deposit.
 * Used to specify how tokens are handled during deposit.
 * - `None`: No deposit allowed.
 * - `Lock`: Tokens are locked in the contract.
 * - `Burn`: Tokens are burned from the user's balance.
 */
export enum DepositType {
  None,
  Lock,
  Burn
}

/**
 * @notice Enum representing the type of withdrawal.
 * Used to specify how tokens are handled during withdrawal.
 * - `None`: No withdrawal allowed.
 * - `Unlock`: Tokens are unlocked from the contract.
 * - `Mint`: New tokens are minted on the target chain.
 */
export enum WithdrawType {
  None,
  Unlock,
  Mint
}

/**
 * @notice Struct containing detailed information about a token mapping.
 * Stores metadata for cross-chain token bridging.
 * @param originChainId The ID of the origin chain.
 * @param targetChainId The ID of the target chain.
 * @param depositType The type of deposit (e.g., None, Lock, Burn).
 * @param withdrawType The type of withdrawal (e.g., None, Unlock, Mint).
 * @param originTokenAddress The token identifier on the origin chain, stored as bytes32.
 * This format allows supporting token addresses from non‑EVM networks.
 * For the bridge coin, this should be the address of the wrapped token on the origin chain.
 * @param targetTokenAddress The token identifier on the target chain, stored as bytes32.
 * This format allows supporting token addresses from non‑EVM networks.
 * For the bridge coin, this should be the address of the wrapped token on the target chain.
 * @param useTransfer Flag that determines which transfer method to use.
 * If true, the contract will use a direct `transfer` call.
 * If false, it will use a low-level call with safety checks `safeTransfer` or `safeTransferFore`.
 * @param isAllowed Boolean flag indicating if the token is allowed for bridging.
 * @param isCoin Boolean flag indicating if the token is a native coin or an ERC20 token.
 */
export interface MapInfo {
  originChainId: string,
  targetChainId: string,
  depositType: DepositType,
  withdrawType: WithdrawType,
  originTokenAddress: string,
  targetTokenAddress: string,
  useTransfer: boolean,
  isAllowed: boolean,
  isCoin: boolean
}
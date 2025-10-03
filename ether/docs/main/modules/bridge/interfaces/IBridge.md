

## IBridge

Interface for a Bridge contract enabling cross-chain token transfers
using a Lock/Burn and Unlock/Mint mechanism.

## Events
#### Deposit

```solidity
event Deposit(bytes32 fromAddress, bytes32 toAddress, bytes32 originTokenAddress, bytes32 targetTokenAddress, uint256 amount, uint256 originChainId, uint256 targetChainId)
```

Emitted when tokens are deposited into the bridge.
Triggered in the &#x60;bridgeTokens&#x60; function upon a successful deposit.

| Name | Type | Description |
| ---- | ---- | ----------- |
| fromAddress | bytes32 | The sender's address on the origin chain. |
| toAddress | bytes32 | The recipient's address on the target chain. |
| originTokenAddress | bytes32 | The address of the token on the origin chain. |
| targetTokenAddress | bytes32 | The address of the token on the target chain. |
| amount | uint256 | The amount of tokens deposited. |
| originChainId | uint256 | The ID of the origin chain. |
| targetChainId | uint256 | The ID of the target chain. |

#### Withdrawal

```solidity
event Withdrawal(bytes32 fromAddress, bytes32 toAddress, bytes32 targetTokenAddress, bytes32 originTokenAddress, bytes32 externalId, uint256 amount, uint256 originChainId, uint256 targetChainId)
```

Emitted when tokens are withdrawn from the bridge.
Triggered in the &#x60;receiveTokens&#x60; function upon a successful withdrawal.

| Name | Type | Description |
| ---- | ---- | ----------- |
| fromAddress | bytes32 | The sender's address on the target chain. |
| toAddress | bytes32 | The recipient's address on the origin chain. |
| targetTokenAddress | bytes32 | The address of the token on the target chain. |
| originTokenAddress | bytes32 | The address of the token on the origin chain. |
| externalId | bytes32 | An external identifier for tracking the bridge transaction. |
| amount | uint256 | The amount of tokens withdrawn. |
| originChainId | uint256 | The ID of the origin chain. |
| targetChainId | uint256 | The ID of the target chain. |

#### MapperAddressChanged

```solidity
event MapperAddressChanged(address account, address oldAddress, address newAddress)
```

Emitted when the Mapper contract address is updated.
Triggered in the &#x60;changeMapperAddress&#x60; function.

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the account that initiated the change. |
| oldAddress | address | The previous address of the Mapper contract. |
| newAddress | address | The new address of the Mapper contract. |

#### GasAccumulatedWithdrawn

```solidity
event GasAccumulatedWithdrawn(address account, uint256 amount)
```

Emitted when the owner withdraws accumulated gas funds.

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address that received the funds. |
| amount | uint256 | The amount of gas funds withdrawn. |

#### LiquidityTokenWithdrawn

```solidity
event LiquidityTokenWithdrawn(address account, address token, uint256 amount, bool useTransfer)
```

Emitted when the owner withdraws liquidity from the contract.

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address that received the funds. |
| token | address | The token address. |
| amount | uint256 | The amount of funds withdrawn. |
| useTransfer | bool | Flag that determines which transfer method to use. If true, the contract will use a direct `transfer` call. If false, it will use a low-level call with safety checks `safeTransfer` or `safeTransferFore`. |

#### LiquidityCoinWithdrawn

```solidity
event LiquidityCoinWithdrawn(address account, uint256 amount)
```

Emitted when the owner withdraws liquidity from the contract.

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address that received the funds. |
| amount | uint256 | The amount of funds withdrawn. |

#### TokensDeposited

```solidity
event TokensDeposited(address account, address token, uint256 amount)
```

Emitted when tokens are deposited into the contract.

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address that sent the tokens. |
| token | address | The token address. |
| amount | uint256 | The amount of tokens deposited. |

#### CoinsDeposited

```solidity
event CoinsDeposited(address account, uint256 amount)
```

Emitted when native coins are deposited into the contract.

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address that sent the coins. |
| amount | uint256 | The amount of coins deposited. |

## Structs
#### InitParams

Struct for initializing the Bridge contract.

```solidity
struct InitParams {
  address mapperAddress;
}
```

| Name | Description |
| ---- | ----------- |
| mapperAddress | The address of the Mapper contract used for token mapping. |

#### ECDSAParams

Struct for storing parameters of an ECDSA signature.

```solidity
struct ECDSAParams {
  bytes32 r;
  bytes32 s;
  bytes32 salt;
  uint64 deadline;
  uint8 v;
}
```

| Name | Description |
| ---- | ----------- |
| r | The r-component of the ECDSA signature. |
| s | The s-component of the ECDSA signature. |
| salt | A random value that allows creating different signatures for the same message having replay attack protection at the same time. |
| deadline | The timestamp until which the signature remains valid. |
| v | The recovery byte of the ECDSA signature. |

#### BridgeParams

Struct for storing parameters of a token bridge request.

```solidity
struct BridgeParams {
  uint256 mapId;
  uint256 amount;
  bytes32 toAddress;
}
```

| Name | Description |
| ---- | ----------- |
| mapId | The ID of the token mapping in the Mapper contract. |
| amount | The amount of tokens to be bridged. |
| toAddress | The recipient's address on the target chain. |

#### ReceiveTokensParams

Struct for storing parameters of a token receiving request.

```solidity
struct ReceiveTokensParams {
  bytes32 externalId;
  uint256 mapId;
  uint256 amount;
  bytes32 fromAddress;
  bytes32 toAddress;
}
```

| Name | Description |
| ---- | ----------- |
| externalId | An external identifier for tracking the bridge transaction. |
| mapId | The ID of the token mapping in the Mapper contract. |
| amount | The amount of tokens to be received. |
| fromAddress | The sender's address on the origin chain. |
| toAddress | The recipient's address on the target chain. |

#### BridgeTokensParams

Struct for combining bridge parameters with an ECDSA signature.

```solidity
struct BridgeTokensParams {
  struct IBridge.BridgeParams bridgeParams;
  struct IBridge.ECDSAParams ECDSAParams;
}
```

| Name | Description |
| ---- | ----------- |
| bridgeParams | The struct containing token bridge details. |
| ECDSAParams | The struct containing ECDSA signature details. |

#### WithdrawTokenLiquidityParams

Struct for combining withdraw parameters with transfer method selection.

```solidity
struct WithdrawTokenLiquidityParams {
  bytes32 tokenAddress;
  address recipientAddress;
  uint256 amount;
  bool useTransfer;
}
```

| Name | Description |
| ---- | ----------- |
| tokenAddress | The token address (bytes32) to withdraw liquidity for. |
| recipientAddress | The address that will receive the withdrawn tokens. |
| amount | The amount of tokens to withdraw. |
| useTransfer | Flag that determines which transfer method to use. If true, the contract will use a direct `transfer` call. If false, it will use a low-level call with safety checks `safeTransfer` or `safeTransferFore`. |

#### WithdrawCoinLiquidityParams

Struct for combining withdraw parameters with transfer method selection.

```solidity
struct WithdrawCoinLiquidityParams {
  address recipientAddress;
  uint256 amount;
}
```

| Name | Description |
| ---- | ----------- |
| recipientAddress | The address that will receive the withdrawn coins. |
| amount | The amount of coin to withdraw. |

## Functions
#### bridgeTokens

```solidity
function bridgeTokens(struct IBridge.BridgeTokensParams bridgeTokensParams) external payable
```
**Selector**: `0xdc5eb87c`

Deposits tokens into the bridge contract.
This function locks or burns tokens depending on the bridging mechanism.

| Name | Type | Description |
| ---- | ---- | ----------- |
| bridgeTokensParams | struct IBridge.BridgeTokensParams | The struct containing parameters for the bridging process. |

#### receiveTokens

```solidity
function receiveTokens(struct IBridge.ReceiveTokensParams receiveTokensParams) external
```
**Selector**: `0x3718ebba`

Receives tokens from the bridge contract.
This function unlocks or mints tokens depending on the withdrawal mechanism.
Only the contract owner can call this function.

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiveTokensParams | struct IBridge.ReceiveTokensParams | The struct containing parameters for the receiving process. |

#### withdrawGasAccumulated

```solidity
function withdrawGasAccumulated() external
```
**Selector**: `0xc987658a`

Withdraws accumulated gas compensation funds to the contract owner.
Transfers the entire gasAccumulated balance to the owner and resets the counter.
Only the contract owner can call this function.
Emits a {GasAccumulatedWithdrawn} event on success.

#### withdrawTokenLiquidity

```solidity
function withdrawTokenLiquidity(struct IBridge.WithdrawTokenLiquidityParams withdrawTokenLiquidityParams) external
```
**Selector**: `0x24bde2c2`

Withdraws token liquidity from the contract to the withdrawRecipient.
Transfers the balance held by the contract to the withdrawRecipient.
Only the contract owner can call this function.

| Name | Type | Description |
| ---- | ---- | ----------- |
| withdrawTokenLiquidityParams | struct IBridge.WithdrawTokenLiquidityParams | The struct containing parameters for the withdraw process. |

#### withdrawCoinLiquidity

```solidity
function withdrawCoinLiquidity(struct IBridge.WithdrawCoinLiquidityParams withdrawCoinLiquidityParams) external
```
**Selector**: `0x64ad4eec`

Withdraws coin liquidity from the contract to the withdrawRecipient.
Transfers the balance held by the contract to the withdrawRecipient.
Only the contract owner can call this function.

| Name | Type | Description |
| ---- | ---- | ----------- |
| withdrawCoinLiquidityParams | struct IBridge.WithdrawCoinLiquidityParams | The struct containing parameters for the withdraw process. |


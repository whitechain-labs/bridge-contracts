

## Bridge

Contract for cross-chain token and coin transfers.

**Inherits:** [Initializable](../../../../@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.md) [UUPSUpgradeable](../../../../@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.md) [Ownable2StepUpgradeable](../../../../@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.md) [ReentrancyGuardUpgradeable](../../../../@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.md) [IBridge](interfaces/IBridge.md)
## Modifiers
#### nonZeroAddress

```solidity
modifier nonZeroAddress(address addr)
```

Modifier to validate that an address is not the zero address.

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | Address to be checked. |

#### nonZeroBytes32

```solidity
modifier nonZeroBytes32(bytes32 _bytes)
```

Modifier to validate that a bytes32 identifier is not zero.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _bytes | bytes32 | The bytes32 value to be checked. |

#### nonZeroUint256

```solidity
modifier nonZeroUint256(uint256 num)
```

Modifier to ensure a provided number is greater than zero.

| Name | Type | Description |
| ---- | ---- | ----------- |
| num | uint256 | The number to check. |

## Public variables
#### gasAccumulated
```solidity
uint256 gasAccumulated
```
**Selector**: `0x4c5f4156`

Accumulated gas fees paid by users during bridging.
Tracks the total amount of coins collected for gas compensation,
which can later be withdrawn by the contract owner and is reset after each withdrawal.

#### Mapper
```solidity
contract IMapper Mapper
```
**Selector**: `0x2002164a`

Contract responsible for mapping tokens across chains.
Used to check if a token is allowed for deposit or withdrawal.

#### usedHashes
```solidity
mapping(bytes32 &#x3D;&gt; bool) usedHashes
```
**Selector**: `0xaef18bf7`

Tracks which message hashes have already been used to prevent replay attacks.
The hash should be computed from all critical parameters and marked as used after successful execution.

## Functions
#### constructor

```solidity
constructor() public
```

#### receive

```solidity
receive() external payable
```

Allows the contract to receive coins.
Triggered when coins is sent directly to the contract without any calldata.
Emits a {CoinsDeposited} event for tracking the deposit.

#### initialize

```solidity
function initialize(struct IBridge.InitParams initParams) external
```
**Selector**: `0x8f09926d`

Initializes the contract with the given parameters.
This function can only be called once due to the &#x60;initializer&#x60; modifier.

| Name | Type | Description |
| ---- | ---- | ----------- |
| initParams | struct IBridge.InitParams | See {IBridge-InitParams}. |

#### bridgeTokens

```solidity
function bridgeTokens(struct IBridge.BridgeTokensParams bridgeTokensParams) external payable
```
**Selector**: `0xdc5eb87c`

See {IBridge-bridgeTokens}.

| Name | Type | Description |
| ---- | ---- | ----------- |
| bridgeTokensParams | struct IBridge.BridgeTokensParams | See {IBridge-BridgeTokensParams}. |

#### receiveTokens

```solidity
function receiveTokens(struct IBridge.ReceiveTokensParams receiveTokensParams) external
```
**Selector**: `0x3718ebba`

See {IBridge-receiveTokens}.

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiveTokensParams | struct IBridge.ReceiveTokensParams | See {IBridge-ReceiveTokensParams}. |

#### withdrawGasAccumulated

```solidity
function withdrawGasAccumulated() external
```
**Selector**: `0xc987658a`

See {IBridge-withdrawGasAccumulated}.

#### withdrawTokenLiquidity

```solidity
function withdrawTokenLiquidity(struct IBridge.WithdrawTokenLiquidityParams withdrawTokenLiquidityParams) external
```
**Selector**: `0x24bde2c2`

See {IBridge-withdrawTokenLiquidity}.

| Name | Type | Description |
| ---- | ---- | ----------- |
| withdrawTokenLiquidityParams | struct IBridge.WithdrawTokenLiquidityParams | See {IBridge-WithdrawTokenLiquidityParams}. |

#### withdrawCoinLiquidity

```solidity
function withdrawCoinLiquidity(struct IBridge.WithdrawCoinLiquidityParams withdrawCoinLiquidityParams) external
```
**Selector**: `0x64ad4eec`

See {IBridge-withdrawCoinLiquidity}.

| Name | Type | Description |
| ---- | ---- | ----------- |
| withdrawCoinLiquidityParams | struct IBridge.WithdrawCoinLiquidityParams | See {IBridge-WithdrawCoinLiquidityParams}. |

#### depositTokens

```solidity
function depositTokens(uint256 mapId, uint256 amount) external
```
**Selector**: `0xf16ad51e`

Allows users to deposit tokens into the contract.
Requires prior approval from the user.
Only the contract owner can call this function.
Emits a {TokensDeposited} event.

| Name | Type | Description |
| ---- | ---- | ----------- |
| mapId | uint256 | The ID of the token mapping in the Mapper contract. |
| amount | uint256 | Amount of tokens to deposit. |

#### depositCoins

```solidity
function depositCoins() external payable
```
**Selector**: `0xc57895f3`

Allows users to deposit coins into the contract.
Only the contract owner can call this function.
Emits a {CoinsDeposited} event.

#### changeMapperAddress

```solidity
function changeMapperAddress(address _newMapperAddress) external
```
**Selector**: `0x28ae4a97`

Changes the address of the Mapper contract.
Only the contract owner can call this function.
Emits a {MapperAddressChanged} event on success.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newMapperAddress | address | The new address of the Mapper contract. |


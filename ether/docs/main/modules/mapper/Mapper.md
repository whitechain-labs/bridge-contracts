

## Mapper

Contract responsible for managing token mappings between different chains.
It supports the registration, updating, and revocation of tokens for bridging.

**Inherits:** [Initializable](../../../../@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.md) [UUPSUpgradeable](../../../../@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.md) [Ownable2StepUpgradeable](../../../../@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.md) [ERC165Upgradeable](../../../../@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.md) [IMapper](interfaces/IMapper.md)
## Modifiers
#### nonZeroBytes32

```solidity
modifier nonZeroBytes32(bytes32 _bytes)
```

Modifier to validate that a bytes32 identifier is not zero.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _bytes | bytes32 | The bytes32 value to be checked. |

## Public variables
#### mapCounter
```solidity
uint256 mapCounter
```
**Selector**: `0x4f4133e8`

Counter for the mapping IDs.
This is incremented each time a new token mapping is added.

#### withdrawAllowedTokens
```solidity
mapping(uint256 &#x3D;&gt; mapping(bytes32 &#x3D;&gt; uint256)) withdrawAllowedTokens
```
**Selector**: `0x5db069c6`

Mapping of allowed tokens for withdrawal.
Stores the mapping IDs for withdrawal-allowed tokens by origin chain ID and a universal token identifier.
The token identifier is stored as bytes32, allowing support for non-EVM networks.

#### depositAllowedTokens
```solidity
mapping(uint256 &#x3D;&gt; mapping(bytes32 &#x3D;&gt; uint256)) depositAllowedTokens
```
**Selector**: `0x4193ae4b`

Mapping of allowed tokens for deposit.
Stores the mapping IDs for deposit-allowed tokens by target and origin chain IDs.
The token identifier is stored as bytes32, allowing support for non-EVM networks.

#### mapInfo
```solidity
mapping(uint256 &#x3D;&gt; struct IMapper.MapInfo) mapInfo
```
**Selector**: `0x4ec5c834`

Mapping of map IDs to their corresponding information.
Stores all metadata related to a token mapping.

## Functions
#### constructor

```solidity
constructor() public
```

#### initialize

```solidity
function initialize() external
```
**Selector**: `0x8129fc1c`

Initializes the contract.

#### enableMapping

```solidity
function enableMapping(uint256 mapId) external
```
**Selector**: `0x6f04e06d`

See {IMapper-enableMapping}.

| Name | Type | Description |
| ---- | ---- | ----------- |
| mapId | uint256 | See {IMapper-enableMapping}. |

#### disableMapping

```solidity
function disableMapping(uint256 mapId) external
```
**Selector**: `0x7c81645c`

See {IMapper-disableMapping}.

| Name | Type | Description |
| ---- | ---- | ----------- |
| mapId | uint256 | See {IMapper-disableMapping}. |

#### registerMapping

```solidity
function registerMapping(struct IMapper.MapInfo newMapInfo) external
```
**Selector**: `0xa78d2f7e`

See {IMapper-registerMapping}.

| Name | Type | Description |
| ---- | ---- | ----------- |
| newMapInfo | struct IMapper.MapInfo | See {IMapper-MapInfo}. |

#### removeMapping

```solidity
function removeMapping(uint256 mapId) external
```
**Selector**: `0x0e71a236`

See {IMapper-removeMapping}.

| Name | Type | Description |
| ---- | ---- | ----------- |
| mapId | uint256 | See {IMapper-removeMapping}. |

#### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool result)
```
**Selector**: `0x01ffc9a7`

See {IERC165-supportsInterface}.

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaceId | bytes4 | See {IERC165-supportsInterface}. |

**Returns:**

| Name | Type | Description |
| ---- | ---- | ----------- |
| result | bool | See {IERC165-supportsInterface}. |


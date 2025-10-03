

## IMapper

Interface for the Mapper contract responsible for managing token mappings across chains.
It defines enums, structures, events, and errors used in the token mapping process.

## Events
#### RegisteredMapping

```solidity
event RegisteredMapping(uint256 mapId, struct IMapper.MapInfo mapInfo)
```

Emitted when a new token mapping is added.
Called in the &#x60;registerMapping&#x60; function of the Mapper contract.

| Name | Type | Description |
| ---- | ---- | ----------- |
| mapId | uint256 | The ID of the newly added token mapping. |
| mapInfo | struct IMapper.MapInfo | Struct containing detailed information about the new mapping. |

#### DisabledMapping

```solidity
event DisabledMapping(uint256 mapId, struct IMapper.MapInfo mapInfo)
```

Emitted when a token mapping is revoked.
Called in the &#x60;disableMapping&#x60; function of the Mapper contract.

| Name | Type | Description |
| ---- | ---- | ----------- |
| mapId | uint256 | The ID of the revoked token mapping. |
| mapInfo | struct IMapper.MapInfo | Struct containing detailed information about the revoked mapping. |

#### EnabledMapping

```solidity
event EnabledMapping(uint256 mapId, struct IMapper.MapInfo mapInfo)
```

Emitted when a restriction on a token mapping is updated.
Called in the &#x60;enableMapping&#x60; function of the Mapper contract.

| Name | Type | Description |
| ---- | ---- | ----------- |
| mapId | uint256 | The ID of the token mapping with updated restriction. |
| mapInfo | struct IMapper.MapInfo | Struct containing updated information about the mapping. |

#### DropToken

```solidity
event DropToken(uint256 mapId)
```

Emitted when a map entry is removed.
This event is triggered when the &#x60;dropToken&#x60; function successfully deletes a mapping.

| Name | Type | Description |
| ---- | ---- | ----------- |
| mapId | uint256 | The unique identifier of the mapping that was deleted. |

## Structs
#### MapInfo

Struct containing detailed information about a token mapping.
Stores metadata for cross-chain token bridging.

```solidity
struct MapInfo {
  uint256 originChainId;
  uint256 targetChainId;
  enum IMapper.DepositType depositType;
  enum IMapper.WithdrawType withdrawType;
  bytes32 originTokenAddress;
  bytes32 targetTokenAddress;
  bool useTransfer;
  bool isAllowed;
  bool isCoin;
}
```

| Name | Description |
| ---- | ----------- |
| originChainId | The ID of the origin chain. |
| targetChainId | The ID of the target chain. |
| depositType | The type of deposit (e.g., None, Lock, Burn). |
| withdrawType | The type of withdrawal (e.g., None, Unlock, Mint). |
| originTokenAddress | The token identifier on the origin chain, stored as bytes32. This format allows supporting token addresses from non‑EVM networks. For the bridge coin, this should be the address of the wrapped token on the origin chain. |
| targetTokenAddress | The token identifier on the target chain, stored as bytes32. This format allows supporting token addresses from non‑EVM networks. For the bridge coin, this should be the address of the wrapped token on the target chain. |
| useTransfer | Flag that determines which transfer method to use. If true, the contract will use a direct `transfer` call. If false, it will use a low-level call with safety checks `safeTransfer` or `safeTransferFore`. |
| isAllowed | Boolean flag indicating if the token is allowed for bridging. |
| isCoin | Boolean flag indicating if the token is a native coin or an token. |

## Functions
#### enableMapping

```solidity
function enableMapping(uint256 mapId) external
```
**Selector**: `0x6f04e06d`

Updates the restriction status of a token.
Sets the token mapping to allowed.
Only the contract owner can call this function.
Emits an {EnabledMapping} event on success.

| Name | Type | Description |
| ---- | ---- | ----------- |
| mapId | uint256 | The ID of the mapping to be updated. |

#### disableMapping

```solidity
function disableMapping(uint256 mapId) external
```
**Selector**: `0x7c81645c`

Revokes a token mapping.
Sets the token mapping to disallowed.
Only the contract owner can call this function.
Emits a {DisabledMapping} event on success.

| Name | Type | Description |
| ---- | ---- | ----------- |
| mapId | uint256 | The ID of the mapping to be revoked. |

#### registerMapping

```solidity
function registerMapping(struct IMapper.MapInfo mapInfo) external
```
**Selector**: `0xa78d2f7e`

Adds a new token mapping.
Registers a new token mapping that defines a one‑directional connection between chains.
Each mapping is created specifically for either deposits or withdrawals.
For the bridge coin, the address of the wrapped token must be provided in the parameters.
Only the contract owner can call this function.
Emits an {RegisteredMapping} event on success.

| Name | Type | Description |
| ---- | ---- | ----------- |
| mapInfo | struct IMapper.MapInfo | The type of mapping (MapInfo). |

#### removeMapping

```solidity
function removeMapping(uint256 mapId) external
```
**Selector**: `0x0e71a236`

Deletes mapping information for a given mapId.
Only the contract owner can call this function.
The function ensures that the provided mapId is valid and belongs to the current chain.
Depending on the deposit and withdraw types, it removes allowed token mappings.

| Name | Type | Description |
| ---- | ---- | ----------- |
| mapId | uint256 | The unique identifier of the map to be deleted. |

#### mapInfo

```solidity
function mapInfo(uint256 mapId) external view returns (uint256 originChainId, uint256 targetChainId, enum IMapper.DepositType depositType, enum IMapper.WithdrawType withdrawType, bytes32 originTokenAddress, bytes32 targetTokenAddress, bool useTransfer, bool isAllowed, bool isCoin)
```
**Selector**: `0x4ec5c834`

Retrieves information about a token mapping.
Returns the details of a mapping associated with a given map ID.
This includes chain IDs, token addresses, deposit and withdrawal types, and status flags.

| Name | Type | Description |
| ---- | ---- | ----------- |
| mapId | uint256 | The ID of the token mapping to be retrieved. |

**Returns:**

| Name | Type | Description |
| ---- | ---- | ----------- |
| originChainId | uint256 | The ID of the origin chain. |
| targetChainId | uint256 | The ID of the target chain. |
| depositType | enum IMapper.DepositType | The type of deposit (e.g., None, Lock, or Burn). |
| withdrawType | enum IMapper.WithdrawType | The type of withdrawal (e.g., None, Unlock, or Mint). |
| originTokenAddress | bytes32 | The token identifier on the origin chain, stored as bytes32. This format allows supporting token addresses from non‑EVM networks. |
| targetTokenAddress | bytes32 | The token identifier on the target chain, stored as bytes32. This format allows supporting token addresses from non‑EVM networks. |
| useTransfer | bool | Flag that determines which transfer method to use. If true, the contract will use a direct `transfer` call. If false, it will use a low-level call with safety checks `safeTransfer` or `safeTransferFore`. |
| isAllowed | bool | Boolean flag indicating if the token is allowed for bridging. |
| isCoin | bool | Boolean flag indicating if the token is a native coin or an token. |


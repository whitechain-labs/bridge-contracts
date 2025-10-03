// SPDX-License-Identifier: MIT
pragma solidity =0.8.30;

/**
 * @title IMapper
 * @author Whitechain
 * @notice Interface for the Mapper contract responsible for managing token mappings across chains.
 * It defines enums, structures, events, and errors used in the token mapping process.
 */
interface IMapper {
    /**
     * @notice Enum representing the type of deposit.
     * Used to specify how tokens are handled during deposit.
     * - `None`: No deposit allowed.
     * - `Lock`: Tokens are locked in the contract.
     * - `Burn`: Tokens are burned from the user's balance.
     */
    enum DepositType {
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
    enum WithdrawType {
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
     * @param isCoin Boolean flag indicating if the token is a native coin or an token.
     */
    struct MapInfo {
        uint256 originChainId;
        uint256 targetChainId;
        DepositType depositType;
        WithdrawType withdrawType;
        bytes32 originTokenAddress;
        bytes32 targetTokenAddress;
        bool useTransfer;
        bool isAllowed;
        bool isCoin;
    }

    /**
     * @notice Emitted when a new token mapping is added.
     * Called in the `registerMapping` function of the Mapper contract.
     * @param mapId The ID of the newly added token mapping.
     * @param mapInfo Struct containing detailed information about the new mapping.
     */
    event RegisteredMapping(uint256 indexed mapId, MapInfo mapInfo);

    /**
     * @notice Emitted when a token mapping is revoked.
     * Called in the `disableMapping` function of the Mapper contract.
     * @param mapId The ID of the revoked token mapping.
     * @param mapInfo Struct containing detailed information about the revoked mapping.
     */
    event DisabledMapping(uint256 indexed mapId, MapInfo mapInfo);

    /**
     * @notice Emitted when a restriction on a token mapping is updated.
     * Called in the `enableMapping` function of the Mapper contract.
     * @param mapId The ID of the token mapping with updated restriction.
     * @param mapInfo Struct containing updated information about the mapping.
     */
    event EnabledMapping(uint256 indexed mapId, MapInfo mapInfo);

    /**
     * @notice Emitted when a map entry is removed.
     * This event is triggered when the `dropToken` function successfully deletes a mapping.
     * @param mapId The unique identifier of the mapping that was deleted.
     */
    event DropToken(uint256 indexed mapId);

    /**
     * @notice Updates the restriction status of a token.
     * Sets the token mapping to allowed.
     * Only the contract owner can call this function.
     * Emits an {EnabledMapping} event on success.
     * @param mapId The ID of the mapping to be updated.
     */
    function enableMapping(uint256 mapId) external;

    /**
     * @notice Revokes a token mapping.
     * Sets the token mapping to disallowed.
     * Only the contract owner can call this function.
     * Emits a {DisabledMapping} event on success.
     * @param mapId The ID of the mapping to be revoked.
     */
    function disableMapping(uint256 mapId) external;

    /**
     * @notice Adds a new token mapping.
     * Registers a new token mapping that defines a one‑directional connection between chains.
     * Each mapping is created specifically for either deposits or withdrawals.
     * For the bridge coin, the address of the wrapped token must be provided in the parameters.
     * Only the contract owner can call this function.
     * Emits an {RegisteredMapping} event on success.
     * @param mapInfo The type of mapping (MapInfo).
     */
    function registerMapping(MapInfo calldata mapInfo) external;

    /**
     * @notice Deletes mapping information for a given mapId.
     * Only the contract owner can call this function.
     * The function ensures that the provided mapId is valid and belongs to the current chain.
     * Depending on the deposit and withdraw types, it removes allowed token mappings.
     * @param mapId The unique identifier of the map to be deleted.
     */
    function removeMapping(uint256 mapId) external;

    /**
     * @notice Retrieves information about a token mapping.
     * Returns the details of a mapping associated with a given map ID.
     * This includes chain IDs, token addresses, deposit and withdrawal types, and status flags.
     * @param mapId The ID of the token mapping to be retrieved.
     * @return originChainId The ID of the origin chain.
     * @return targetChainId The ID of the target chain.
     * @return depositType The type of deposit (e.g., None, Lock, or Burn).
     * @return withdrawType The type of withdrawal (e.g., None, Unlock, or Mint).
     * @return originTokenAddress The token identifier on the origin chain, stored as bytes32.
     * This format allows supporting token addresses from non‑EVM networks.
     * @return targetTokenAddress The token identifier on the target chain, stored as bytes32.
     * This format allows supporting token addresses from non‑EVM networks.
     * @return useTransfer Flag that determines which transfer method to use.
     * If true, the contract will use a direct `transfer` call.
     * If false, it will use a low-level call with safety checks `safeTransfer` or `safeTransferFore`.
     * @return isAllowed Boolean flag indicating if the token is allowed for bridging.
     * @return isCoin Boolean flag indicating if the token is a native coin or an token.
     */
    function mapInfo(
        uint256 mapId
    )
        external
        view
        returns (
            uint256 originChainId,
            uint256 targetChainId,
            IMapper.DepositType depositType,
            IMapper.WithdrawType withdrawType,
            bytes32 originTokenAddress,
            bytes32 targetTokenAddress,
            bool useTransfer,
            bool isAllowed,
            bool isCoin
        );
}

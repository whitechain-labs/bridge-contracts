// SPDX-License-Identifier: MIT
pragma solidity =0.8.30;

import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { ERC165Upgradeable } from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import { IMapper } from "./interfaces/IMapper.sol";

/**
 * @title MapperTest
 * @author Whitechain
 * @notice Contract responsible for managing token mappings between different chains.
 * It supports the registration, updating, and revocation of tokens for bridging.
 */
contract MapperTest is Initializable, UUPSUpgradeable, Ownable2StepUpgradeable, ERC165Upgradeable, IMapper {
    /**
     * @notice Counter for the mapping IDs.
     * This is incremented each time a new token mapping is added.
     */
    uint256 public mapCounter;

    /**
     * @notice Mapping of allowed tokens for withdrawal.
     * Stores the mapping IDs for withdrawal-allowed tokens by origin chain ID and a universal token identifier.
     * The token identifier is stored as bytes32, allowing support for non-EVM networks.
     */
    mapping(uint256 originChainId => mapping(bytes32 targetTokenAddress => uint256 mapId)) public withdrawAllowedTokens;

    /**
     * @notice Mapping of allowed tokens for deposit.
     * Stores the mapping IDs for deposit-allowed tokens by target and origin chain IDs.
     * The token identifier is stored as bytes32, allowing support for non-EVM networks.
     */
    mapping(uint256 targetChainId => mapping(bytes32 originTokenAddress => uint256 mapId)) public depositAllowedTokens;

    /**
     * @notice Mapping of map IDs to their corresponding information.
     * Stores all metadata related to a token mapping.
     */
    mapping(uint256 mapId => MapInfo mapInfo) public mapInfo;

    /**
     * @notice Example public variable used for testing purposes.
     */
    uint256 public test;

    /**
     * @notice Reserved storage slots for future upgrades to prevent storage collisions.
     */
    uint256[49] private __gap;

    /**
     * @notice Modifier to validate that a bytes32 identifier is not zero.
     * @param _bytes The bytes32 value to be checked.
     */
    modifier nonZeroBytes32(bytes32 _bytes) {
        require(_bytes != bytes32(0), "Mapper: Bytes must be not equal zero");
        _;
    }

    /**
     * @notice Constructor to disable initializers for security reasons.
     * This is required for UUPS upgradeable contracts.
     */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract.
     */
    function initialize() external initializer {
        __UUPSUpgradeable_init();
        __Ownable2Step_init();
    }

    /**
     * @notice See {IMapper-enableMapping}.
     * @param mapId See {IMapper-enableMapping}.
     */
    function enableMapping(uint256 mapId) external onlyOwner {
        require(mapCounter >= mapId, "Mapper: MapCounter must be greater than or equal mapId");
        require(!mapInfo[mapId].isAllowed, "Mapper: IsAllowed must be false");
        mapInfo[mapId].isAllowed = true;

        emit EnabledMapping({ mapId: mapId, mapInfo: mapInfo[mapId] });
    }

    /**
     * @notice See {IMapper-disableMapping}.
     * @param mapId See {IMapper-disableMapping}.
     */
    function disableMapping(uint256 mapId) external onlyOwner {
        require(mapCounter >= mapId, "Mapper: MapCounter must be greater than or equal mapId");
        require(mapInfo[mapId].isAllowed, "Mapper: IsAllowed must be true");
        mapInfo[mapId].isAllowed = false;

        emit DisabledMapping({ mapId: mapId, mapInfo: mapInfo[mapId] });
    }

    /**
     * @notice See {IMapper-registerMapping}.
     * @param newMapInfo See {IMapper-MapInfo}.
     */
    function registerMapping(
        MapInfo calldata newMapInfo
    ) external onlyOwner nonZeroBytes32(newMapInfo.originTokenAddress) nonZeroBytes32(newMapInfo.targetTokenAddress) {
        ++mapCounter;

        if (newMapInfo.withdrawType == WithdrawType.None && newMapInfo.depositType != DepositType.None) {
            require(block.chainid == newMapInfo.originChainId, "Mapper: ChainId must be equal to originChainId");

            if (newMapInfo.isCoin) {
                require(newMapInfo.depositType == DepositType.Lock, "Mapper: DepositType must be equal to Lock");
            }

            uint256 mapId = depositAllowedTokens[newMapInfo.targetChainId][newMapInfo.originTokenAddress];

            require(mapId == 0, "Mapper: MapId must be equal to 0");

            depositAllowedTokens[newMapInfo.targetChainId][newMapInfo.originTokenAddress] = mapCounter;
        } else if (newMapInfo.withdrawType != WithdrawType.None && newMapInfo.depositType == DepositType.None) {
            require(block.chainid == newMapInfo.targetChainId, "Mapper: ChainId must be equal to targetChainId");

            if (newMapInfo.isCoin) {
                require(newMapInfo.withdrawType == WithdrawType.Unlock, "Mapper: WithdrawType must be equal to Unlock");
            }

            uint256 mapId = withdrawAllowedTokens[newMapInfo.originChainId][newMapInfo.targetTokenAddress];

            require(mapId == 0, "Mapper: MapId must be equal to 0");

            withdrawAllowedTokens[newMapInfo.originChainId][newMapInfo.targetTokenAddress] = mapCounter;
        } else {
            revert("Mapper: Invalid map types");
        }

        mapInfo[mapCounter] = MapInfo({
            originChainId: newMapInfo.originChainId,
            targetChainId: newMapInfo.targetChainId,
            depositType: newMapInfo.depositType,
            withdrawType: newMapInfo.withdrawType,
            originTokenAddress: newMapInfo.originTokenAddress,
            targetTokenAddress: newMapInfo.targetTokenAddress,
            useTransfer: newMapInfo.useTransfer,
            isAllowed: newMapInfo.isAllowed,
            isCoin: newMapInfo.isCoin
        });

        emit RegisteredMapping({ mapId: mapCounter, mapInfo: newMapInfo });
    }

    /**
     * @notice See {IMapper-removeMapping}.
     * @param mapId See {IMapper-removeMapping}.
     */
    function removeMapping(uint256 mapId) external onlyOwner {
        require(mapCounter >= mapId, "Mapper: MapCounter must be greater than or equal mapId");

        MapInfo memory _mapInfo = mapInfo[mapId];

        if (_mapInfo.withdrawType == WithdrawType.None && _mapInfo.depositType != DepositType.None) {
            delete depositAllowedTokens[_mapInfo.targetChainId][_mapInfo.originTokenAddress];
        } else if (_mapInfo.withdrawType != WithdrawType.None && _mapInfo.depositType == DepositType.None) {
            delete withdrawAllowedTokens[_mapInfo.originChainId][_mapInfo.targetTokenAddress];
        } else {
            revert("Mapper: Invalid mapId");
        }

        delete mapInfo[mapId];

        emit DropToken({ mapId: mapId });
    }

    /**
     * @notice See {IERC165-supportsInterface}.
     * @param interfaceId See {IERC165-supportsInterface}.
     * @return result See {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC165Upgradeable) returns (bool result) {
        return interfaceId == type(IMapper).interfaceId || super.supportsInterface({ interfaceId: interfaceId });
    }

    /**
     * @notice Authorizes the upgrade of the contract to a new implementation.
     * This function overrides `_authorizeUpgrade` from UUPSUpgradeable.
     * Only the contract owner can authorize an upgrade.
     * @param newImplementation Address of the new implementation contract.
     */
    function _authorizeUpgrade(address newImplementation) internal override(UUPSUpgradeable) onlyOwner {}
}

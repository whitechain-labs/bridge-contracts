// SPDX-License-Identifier: MIT
pragma solidity =0.8.30;

import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { IBridge } from "./../../../../main/modules/bridge/interfaces/IBridge.sol";

/**
 * @title BridgeWrapper
 * @author Whitechain
 * @notice Wrapper for calling bridge functions in tests or integrations.
 * Useful for interacting with the IBridge interface from external contracts.
 */
contract BridgeWrapper {
    /**
     * @notice Calls the withdrawGasAccumulated function from a given bridge contract.
     * This function assumes the bridgeAddress is a contract implementing IBridge.
     * @param bridgeAddress The address of the bridge contract.
     */
    function withdrawGasAccumulatedWrapper(address bridgeAddress) external {
        IBridge(bridgeAddress).withdrawGasAccumulated();
    }

    /**
     * @notice Accepts ownership of the contract.
     * This function calls `acceptOwnership()` on the target bridge contract,
     * finalizing a two-step ownership transfer process initiated with `transferOwnership()`.
     * @param bridgeAddress The address of the bridge contract whose ownership is being accepted.
     */
    function acceptOwnership(address bridgeAddress) external {
        Ownable2StepUpgradeable(bridgeAddress).acceptOwnership();
    }
}

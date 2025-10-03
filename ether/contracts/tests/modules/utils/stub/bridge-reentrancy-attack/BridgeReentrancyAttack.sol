// SPDX-License-Identifier: MIT
pragma solidity =0.8.30;

import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { IBridge } from "./../../../../../main/modules/bridge/interfaces/IBridge.sol";

/**
 * @title BridgeReentrancyAttack
 * @author Whitechain
 * @notice This contract is a testing utility designed to simulate a reentrancy attack
 * on the Bridge contract by repeatedly calling `withdrawGasAccumulated` during
 * the receive hook. It is intended for security testing and should not be used
 * in production.
 */
contract BridgeReentrancyAttack {
    /**
     * @notice Address of the target Bridge contract that we are trying to exploit.
     * Stored as payable so this contract can receive Ether from it.
     */
    address payable public bridgeContractAddress;

    /**
     * @notice Initializes the contract with the address of the target Bridge contract.
     * @param _bridgeContractAddress The address of the Bridge contract to attack.
     */
    constructor(address payable _bridgeContractAddress) {
        bridgeContractAddress = _bridgeContractAddress;
    }

    /**
     * @notice Fallback function triggered when this contract receives Ether.
     */
    receive() external payable {
        IBridge(bridgeContractAddress).withdrawGasAccumulated();
    }

    /**
     * @notice Initiates the attack by calling withdrawGasAccumulated()
     * on the target Bridge contract. This call should cause the Bridge
     * to send Ether back, which triggers receive() and attempts reentrancy.
     */
    function attack() external {
        IBridge(bridgeContractAddress).withdrawGasAccumulated();
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

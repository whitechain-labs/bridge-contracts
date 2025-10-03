// SPDX-License-Identifier: MIT
pragma solidity =0.8.30;

import { ECDSAUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";

/**
 * @title ECDSAChecks library
 * @author Whitechain
 * @notice Library providing functions for validating ECDSA signatures.
 * Utilizes OpenZeppelin's ECDSAUpgradeable library for signature verification.
 * Use this library to ensure that a given signature was produced by the expected signer
 * and to add additional safety checks for signature-based authorization.
 */
library ECDSAChecks {
    /**
     * Using the ECDSAUpgradeable library for working with digital signatures.
     */
    using ECDSAUpgradeable for bytes32;

    /**
     * @notice Struct for storing parameters of an ECDSA signature.
     * @param hash The message hash that was signed.
     * @param r The r-component of the ECDSA signature.
     * @param s The s-component of the ECDSA signature.
     * @param signerAddress The address expected to have signed the message.
     * @param deadline The timestamp until which the signature remains valid.
     * @param v The recovery byte of the ECDSA signature.
     */
    struct ECDSAParams {
        bytes32 hash;
        bytes32 r;
        bytes32 s;
        address signerAddress;
        uint64 deadline;
        uint8 v;
    }

    /**
     * @notice Modifier to ensure that a provided address is not the zero address.
     * @param _addr The address to validate.
     */
    modifier nonZeroAddress(address _addr) {
        require(_addr != address(0), "ECDSAChecks: Address must be not equal zero");
        _;
    }

    /**
     * @notice Validates an ECDSA signature based on provided parameters.
     * Verifies that the signature is not expired and that the recovered signer
     * matches the expected signer.
     * @param _ECDSAParams A struct containing the signature parameters.
     * @return isValid True if the signature is valid and matches the expected signer.
     */
    function validate(
        ECDSAParams memory _ECDSAParams
    ) internal view nonZeroAddress(_ECDSAParams.signerAddress) returns (bool isValid) {
        require(_ECDSAParams.deadline >= block.timestamp, "ECDSAChecks: Signature Expired");

        // Recovering the address of the signer from the signature
        bytes32 _messageHash = _ECDSAParams.hash.toEthSignedMessageHash();
        address _signer = _messageHash.recover({ v: _ECDSAParams.v, r: _ECDSAParams.r, s: _ECDSAParams.s });

        // Verifying that the recovered signer matches the expected signer's address
        require(_signer == _ECDSAParams.signerAddress, "ECDSAChecks: invalid signature");

        return true;
    }
}

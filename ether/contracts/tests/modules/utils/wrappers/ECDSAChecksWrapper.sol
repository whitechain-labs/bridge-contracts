// SPDX-License-Identifier: MIT
pragma solidity =0.8.30;

import { ECDSAChecks } from "../../../../main/libraries/ECDSAChecks.sol";

/**
 * @title ECDSAChecksWrapper
 * @author Whitechain
 * @notice A simple wrapper contract that exposes ECDSA signature validation via the ECDSAChecks library.
 * Uses the ECDSAChecks library to validate signatures passed in through the ECDSAParams struct.
 */
contract ECDSAChecksWrapper {
    /**
     * @notice Attach the ECDSAChecks library to the ECDSAParams type for extended functionality.
     */
    using ECDSAChecks for ECDSAChecks.ECDSAParams;

    /**
     * @notice Validates an ECDSA signature using parameters provided in the struct.
     * @param params The ECDSA parameters including message, signature, and signer address.
     * @return isValid Boolean indicating whether the signature is valid.
     */
    function validateECDSAWrapper(ECDSAChecks.ECDSAParams calldata params) external view returns (bool isValid) {
        return params.validate();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity =0.8.24;

/**
 * @title IERC20Mintable
 * @author Whitechain
 * @notice Interface for tokens with minting functionality.
 * This interface defines a function for minting new tokens to a specified address.
 * Implement this interface if your token needs the ability to create (mint) new tokens.
 */
interface IERC20Mintable {
    /**
     * @notice Mints new tokens to a specified address.
     * Creates `amount` new tokens and assigns them to the `to` address, increasing the total supply.
     * This function can only be called by an entity with the appropriate minting privileges
     * @param to The recipient address of the newly minted tokens.
     * @param amount The number of tokens to mint.
     */
    function mint(address to, uint256 amount) external;
}

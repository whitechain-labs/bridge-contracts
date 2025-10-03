// SPDX-License-Identifier: MIT
pragma solidity =0.8.30;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ExampleToken
 * @author Whitechain
 * @notice A test token that doesn't need to be deployed to the blockchain, to be used only for testing
 * in a local environment.
 */
contract ExampleToken is ERC20 {
    /**
     * @notice Amount of tokens a user can request
     */
    uint256 public constant REQUEST_AMOUNT = 10000000 ether;

    /**
     * @notice Constructs the token by setting its name, symbol, and initially minting the total supply to the deployer.
     * @param _ownerBalance The amount of tokens that will be minted and assigned to the deployer's address.
     */
    constructor(uint256 _ownerBalance) ERC20("Example Token", "ET") {
        _mint(msg.sender, _ownerBalance);
    }

    /**
     * @notice Allows any caller to request tokens, which mints and transfers the REQUEST_AMOUNT to their address.
     */
    function requestTokens() public {
        _mint(msg.sender, REQUEST_AMOUNT);
    }

    /**
     * @notice Burns a specified amount of tokens from the caller's balance.
     * Decreases total supply by the burned amount.
     * @param amount The number of tokens to burn.
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    /**
     * @notice Mints a specified amount of tokens to a given address.
     * Increases total supply by the minted amount.
     * @param account The recipient address.
     * @param amount The number of tokens to mint.
     */
    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    /**
     * @notice Overrides the `decimals` function to return 6 instead of the default 18,
     * to mimic the token's decimal count.
     * @return decimal The number of decimals used for this token.
     */
    function decimals() public view virtual override returns (uint8 decimal) {
        return 18;
    }
}

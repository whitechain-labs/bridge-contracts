// SPDX-License-Identifier: MIT
pragma solidity =0.8.30;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { ERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

/**
 * @title ExampleUUPSToken
 * @author Whitechain
 * @notice A mock token used for local testing that supports UUPS upgradability.
 * Mimics real token behavior and allows users to mint tokens via `requestTokens`.
 */
contract ExampleUUPSToken is Initializable, ERC20Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    /**
     * @notice Amount of tokens a user can request
     */
    uint256 public constant REQUEST_AMOUNT = 10000000 ether;

    /**
     * @notice Constructs the token.
     */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializing the token by setting its name, symbol,
     * and initially minting the total supply to the deployer.
     * @param _ownerBalance The amount of tokens that will be minted and assigned to the deployer's address.
     */
    function initialize(uint256 _ownerBalance) public initializer {
        __ERC20_init("Example UUPS Token", "EUT");
        __Ownable_init();
        __UUPSUpgradeable_init();
        _mint(msg.sender, _ownerBalance);
    }

    /**
     * @notice Allows any caller to request tokens, which mints and transfers the REQUEST_AMOUNT to their address.
     */
    function requestTokens() public {
        _mint(msg.sender, REQUEST_AMOUNT); // Mint and transfer 1000 tokens to the caller's address.
    }

    /**
     * @notice Burns a specified amount of tokens from the caller's balance.
     * Reduces the total supply by the given amount from msg.sender.
     * @param amount The number of tokens to burn.
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    /**
     * @notice Overrides the `decimals` function to return 6 instead of the default 18,
     * to mimic the token's decimal count.
     * @return decimal The number of decimals used for this token.
     */
    function decimals() public view virtual override returns (uint8 decimal) {
        return 18; // Override to set decimal count to 6.
    }

    /**
     * @notice Authorizes the upgrade of the contract to a new implementation.
     * This function overrides `_authorizeUpgrade` from UUPSUpgradeable.
     * Only the contract owner can authorize an upgrade.
     * @param newImplementation Address of the new implementation contract.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

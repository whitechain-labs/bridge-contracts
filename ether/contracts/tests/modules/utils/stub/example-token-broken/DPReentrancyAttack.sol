// SPDX-License-Identifier: MIT
pragma solidity =0.8.30;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title IBridgeDepositTokens
 * @author Whitechain
 * @notice Interface for a Bridge contract.
 */
interface IBridgeDepositTokens {
    /**
     * @notice Allows users to deposit tokens into the contract.
     * Requires prior approval from the user.
     * Only the contract owner can call this function.
     * Emits a {TokensDeposited} event.
     * @param mapId The ID of the token mapping in the Mapper contract.
     * @param amount Amount of tokens to deposit.
     */
    function depositTokens(uint256 mapId, uint256 amount) external;
}
/**
 * @title DPReentrancyAttack
 * @author Whitechain
 * @notice This contract is a testing utility designed to simulate a reentrancy attack
 * on the Bridge contract by repeatedly calling `DPReentrancyAttack` during
 * the receive hook. It is intended for security testing and should not be used
 * in production.
 */
contract DPReentrancyAttack is ERC20 {
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
     * @notice Transfers a specified amount of tokens to a given address by invoking `receiveTokens` on the caller.
     * @param from The address from which the tokens are being transferred.
     * @param to The recipient address that will receive the tokens.
     * @param amount The amount of tokens to transfer to the recipient.
     * @return result Always returns true if the call succeeds.
     */
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool result) {
        IBridgeDepositTokens(msg.sender).depositTokens(7, amount);

        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
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

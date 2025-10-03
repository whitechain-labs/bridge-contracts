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
     * @notice Struct for combining withdraw parameters with transfer method selection.
     * @param tokenAddress The token address (bytes32) to withdraw liquidity for.
     * @param withdrawRecipient The address that will receive the withdrawn tokens.
     * @param amount The amount of tokens to withdraw.
     * @param useTransfer Flag that determines which transfer method to use.
     * If true, the contract will use a direct `transfer` call.
     * If false, it will use a low-level call with safety checks `safeTransfer` or `safeTransferFore`.
     */
    struct WithdrawTokenLiquidityParams {
        bytes32 tokenAddress;
        address withdrawRecipient;
        uint256 amount;
        bool useTransfer;
    }

    /**
     * @notice Withdraws token liquidity from the contract to the withdrawRecipient.
     * Transfers the balance held by the contract to the withdrawRecipient.
     * Only the contract owner can call this function.
     * @param withdrawTokenLiquidityParams The struct containing parameters for the withdraw process.
     */
    function withdrawTokenLiquidity(WithdrawTokenLiquidityParams calldata withdrawTokenLiquidityParams) external;
}
/**
 * @title WTLReentrancyAttack
 * @author Whitechain
 * @notice This contract is a testing utility designed to simulate a reentrancy attack
 * on the Bridge contract by repeatedly calling `WTLReentrancyAttack` during
 * the receive hook. It is intended for security testing and should not be used
 * in production.
 */
contract WTLReentrancyAttack is ERC20 {
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
     * @param to The recipient address that will receive the tokens.
     * @param amount The amount of tokens to transfer to the recipient.
     * @return result Always returns true if the call succeeds.
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool result) {
        IBridgeDepositTokens(msg.sender).withdrawTokenLiquidity(
            IBridgeDepositTokens.WithdrawTokenLiquidityParams({
                tokenAddress: bytes32(uint256(uint160(address(this)))),
                withdrawRecipient: to,
                amount: amount,
                useTransfer: false
            })
        );
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

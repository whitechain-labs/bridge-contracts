// SPDX-License-Identifier: MIT
pragma solidity =0.8.30;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IBridge } from "../../../../../main/modules/bridge/interfaces/IBridge.sol";
/**
 * @title ExampleToken
 * @author Whitechain
 * @notice A test token that doesn't need to be deployed to the blockchain, to be used only for testing
 * in a local environment.
 */
contract ExampleTokenBroken is ERC20 {
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
     * @notice Burns a specified amount of tokens by bridging them out
     * using the `bridgeTokens` function on the caller (assumed to be a Bridge contract).
     * @param amount The amount of tokens to burn and send through the bridge.
     */
    function burn(uint256 amount) public {
        IBridge(msg.sender).bridgeTokens(
            IBridge.BridgeTokensParams(
                IBridge.BridgeParams({ mapId: 7, amount: amount, toAddress: bytes32(uint256(uint160(msg.sender))) }),
                IBridge.ECDSAParams({
                    r: 0xdac1fcb4a0af1076362700ea62314f0d613eb51c286dc6794d0269b08a3a3019,
                    s: 0x61cd3625521a4bce46f41fce1ef27bca3ec3ed24a1735b14cdedc46cdccc3653,
                    salt: 0x61cd3625521a4bce46f41fce1ef27bca3ec3ed24a1735b14cdedc46cdccc3653,
                    deadline: 2748623600,
                    v: 28
                })
            )
        );
    }

    /**
     * @notice Transfers a specified amount of tokens to a given address by invoking `receiveTokens` on the caller.
     * @param to The recipient address that will receive the tokens.
     * @param amount The amount of tokens to transfer to the recipient.
     * @return result Always returns true if the call succeeds.
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool result) {
        IBridge(msg.sender).receiveTokens(
            IBridge.ReceiveTokensParams({
                externalId: 0xdac1fcb4a0af1076362700ea62314f0d613eb51c286dc6794d0269b08a3a3019,
                mapId: 7,
                amount: amount,
                fromAddress: bytes32(uint256(uint160(msg.sender))),
                toAddress: bytes32(uint256(uint160(to)))
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

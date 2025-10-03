// SPDX-License-Identifier: MIT
pragma solidity =0.8.30;

/**
 * @title IBridge
 * @author Whitechain
 * @notice Interface for a Bridge contract enabling cross-chain token transfers
 * using a Lock/Burn and Unlock/Mint mechanism.
 */
interface IBridge {
    /**
     * @notice Struct for initializing the Bridge contract.
     * @param mapperAddress The address of the Mapper contract used for token mapping.
     */
    struct InitParams {
        address mapperAddress;
    }

    /**
     * @notice Struct for storing parameters of an ECDSA signature.
     * @param r The r-component of the ECDSA signature.
     * @param s The s-component of the ECDSA signature.
     * @param salt A random value that allows creating different signatures for the same message having
     * replay attack protection at the same time.
     * @param deadline The timestamp until which the signature remains valid.
     * @param v The recovery byte of the ECDSA signature.
     */
    struct ECDSAParams {
        bytes32 r;
        bytes32 s;
        bytes32 salt;
        uint64 deadline;
        uint8 v;
    }

    /**
     * @notice Struct for storing parameters of a token bridge request.
     * @param mapId The ID of the token mapping in the Mapper contract.
     * @param amount The amount of tokens to be bridged.
     * @param toAddress The recipient's address on the target chain.
     */
    struct BridgeParams {
        uint256 mapId;
        uint256 amount;
        bytes32 toAddress;
    }

    /**
     * @notice Struct for storing parameters of a token receiving request.
     * @param externalId An external identifier for tracking the bridge transaction.
     * @param mapId The ID of the token mapping in the Mapper contract.
     * @param amount The amount of tokens to be received.
     * @param fromAddress The sender's address on the origin chain.
     * @param toAddress The recipient's address on the target chain.
     */
    struct ReceiveTokensParams {
        bytes32 externalId;
        uint256 mapId;
        uint256 amount;
        bytes32 fromAddress;
        bytes32 toAddress;
    }

    /**
     * @notice Struct for combining bridge parameters with an ECDSA signature.
     * @param bridgeParams The struct containing token bridge details.
     * @param ECDSAParams The struct containing ECDSA signature details.
     */
    struct BridgeTokensParams {
        BridgeParams bridgeParams;
        ECDSAParams ECDSAParams;
    }

    /**
     * @notice Struct for combining withdraw parameters with transfer method selection.
     * @param tokenAddress The token address (bytes32) to withdraw liquidity for.
     * @param recipientAddress The address that will receive the withdrawn tokens.
     * @param amount The amount of tokens to withdraw.
     * @param useTransfer Flag that determines which transfer method to use.
     * If true, the contract will use a direct `transfer` call.
     * If false, it will use a low-level call with safety checks `safeTransfer` or `safeTransferFore`.
     */
    struct WithdrawTokenLiquidityParams {
        bytes32 tokenAddress;
        address recipientAddress;
        uint256 amount;
        bool useTransfer;
    }

    /**
     * @notice Struct for combining withdraw parameters with transfer method selection.
     * @param recipientAddress The address that will receive the withdrawn coins.
     * @param amount The amount of coin to withdraw.
     */
    struct WithdrawCoinLiquidityParams {
        address recipientAddress;
        uint256 amount;
    }

    /**
     * @notice Emitted when tokens are deposited into the bridge.
     * Triggered in the `bridgeTokens` function upon a successful deposit.
     * @param fromAddress The sender's address on the origin chain.
     * @param toAddress The recipient's address on the target chain.
     * @param originTokenAddress The address of the token on the origin chain.
     * @param targetTokenAddress The address of the token on the target chain.
     * @param amount The amount of tokens deposited.
     * @param originChainId The ID of the origin chain.
     * @param targetChainId The ID of the target chain.
     */
    event Deposit(
        bytes32 indexed fromAddress,
        bytes32 indexed toAddress,
        bytes32 indexed originTokenAddress,
        bytes32 targetTokenAddress,
        uint256 amount,
        uint256 originChainId,
        uint256 targetChainId
    );

    /**
     * @notice Emitted when tokens are withdrawn from the bridge.
     * Triggered in the `receiveTokens` function upon a successful withdrawal.
     * @param fromAddress The sender's address on the target chain.
     * @param toAddress The recipient's address on the origin chain.
     * @param targetTokenAddress The address of the token on the target chain.
     * @param originTokenAddress The address of the token on the origin chain.
     * @param externalId An external identifier for tracking the bridge transaction.
     * @param amount The amount of tokens withdrawn.
     * @param originChainId The ID of the origin chain.
     * @param targetChainId The ID of the target chain.
     */
    event Withdrawal(
        bytes32 indexed fromAddress,
        bytes32 indexed toAddress,
        bytes32 indexed targetTokenAddress,
        bytes32 originTokenAddress,
        bytes32 externalId,
        uint256 amount,
        uint256 originChainId,
        uint256 targetChainId
    );

    /**
     * @notice Emitted when the Mapper contract address is updated.
     * Triggered in the `changeMapperAddress` function.
     * @param account The address of the account that initiated the change.
     * @param oldAddress The previous address of the Mapper contract.
     * @param newAddress The new address of the Mapper contract.
     */
    event MapperAddressChanged(address indexed account, address indexed oldAddress, address indexed newAddress);

    /**
     * @notice Emitted when the owner withdraws accumulated gas funds.
     * @param account The address that received the funds.
     * @param amount The amount of gas funds withdrawn.
     */
    event GasAccumulatedWithdrawn(address indexed account, uint256 indexed amount);

    /**
     * @notice Emitted when the owner withdraws liquidity from the contract.
     * @param account The address that received the funds.
     * @param token The token address.
     * @param amount The amount of funds withdrawn.
     * @param useTransfer Flag that determines which transfer method to use.
     * If true, the contract will use a direct `transfer` call.
     * If false, it will use a low-level call with safety checks `safeTransfer` or `safeTransferFore`.
     */
    event LiquidityTokenWithdrawn(
        address indexed account,
        address indexed token,
        uint256 indexed amount,
        bool useTransfer
    );

    /**
     * @notice Emitted when the owner withdraws liquidity from the contract.
     * @param account The address that received the funds.
     * @param amount The amount of funds withdrawn.
     */
    event LiquidityCoinWithdrawn(address indexed account, uint256 indexed amount);

    /**
     * @notice Emitted when tokens are deposited into the contract.
     * @param account The address that sent the tokens.
     * @param token The token address.
     * @param amount The amount of tokens deposited.
     */
    event TokensDeposited(address indexed account, address indexed token, uint256 indexed amount);

    /**
     * @notice Emitted when native coins are deposited into the contract.
     * @param account The address that sent the coins.
     * @param amount The amount of coins deposited.
     */
    event CoinsDeposited(address indexed account, uint256 indexed amount);

    /**
     * @notice Deposits tokens into the bridge contract.
     * This function locks or burns tokens depending on the bridging mechanism.
     * @param bridgeTokensParams The struct containing parameters for the bridging process.
     */
    function bridgeTokens(BridgeTokensParams calldata bridgeTokensParams) external payable;

    /**
     * @notice Receives tokens from the bridge contract.
     * This function unlocks or mints tokens depending on the withdrawal mechanism.
     * Only the contract owner can call this function.
     * @param receiveTokensParams The struct containing parameters for the receiving process.
     */
    function receiveTokens(ReceiveTokensParams calldata receiveTokensParams) external;

    /**
     * @notice Withdraws accumulated gas compensation funds to the contract owner.
     * Transfers the entire gasAccumulated balance to the owner and resets the counter.
     * Only the contract owner can call this function.
     * Emits a {GasAccumulatedWithdrawn} event on success.
     */
    function withdrawGasAccumulated() external;

    /**
     * @notice Withdraws token liquidity from the contract to the withdrawRecipient.
     * Transfers the balance held by the contract to the withdrawRecipient.
     * Only the contract owner can call this function.
     * @param withdrawTokenLiquidityParams The struct containing parameters for the withdraw process.
     */
    function withdrawTokenLiquidity(WithdrawTokenLiquidityParams calldata withdrawTokenLiquidityParams) external;

    /**
     * @notice Withdraws coin liquidity from the contract to the withdrawRecipient.
     * Transfers the balance held by the contract to the withdrawRecipient.
     * Only the contract owner can call this function.
     * @param withdrawCoinLiquidityParams The struct containing parameters for the withdraw process.
     */
    function withdrawCoinLiquidity(WithdrawCoinLiquidityParams calldata withdrawCoinLiquidityParams) external;
}

// SPDX-License-Identifier: MIT
pragma solidity =0.8.30;

import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {
    ReentrancyGuardUpgradeable
} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {
    ERC20BurnableUpgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import { SafeERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { ERC165Checker } from "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import { IERC20Mintable } from "./../../interfaces/IERC20Mintable.sol";
import { ECDSAChecks } from "./../../libraries/ECDSAChecks.sol";
import { IMapper } from "./../mapper/interfaces/IMapper.sol";
import { IBridge } from "./interfaces/IBridge.sol";

/**
 * @title BridgeTest
 * @author Whitechain
 * @notice Contract for cross-chain token and coin transfers.
 */
contract BridgeTest is Initializable, UUPSUpgradeable, Ownable2StepUpgradeable, ReentrancyGuardUpgradeable, IBridge {
    /**
     * @notice Using SafeERC20Upgradeable to ensure safe interactions with tokens.
     * This prevents issues where some tokens return false instead of reverting.
     */
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /**
     * @notice Accumulated gas fees paid by users during bridging.
     * Tracks the total amount of coins collected for gas compensation,
     * which can later be withdrawn by the contract owner and is reset after each withdrawal.
     */
    uint256 public gasAccumulated;

    /**
     * @notice Contract responsible for mapping tokens across chains.
     * Used to check if a token is allowed for deposit or withdrawal.
     */
    IMapper public Mapper;

    /**
     * @notice Tracks which message hashes have already been used to prevent replay attacks.
     * The hash should be computed from all critical parameters and marked as used after successful execution.
     */
    mapping(bytes32 hash => bool isUsed) public usedHashes;

    /**
     * @notice Example public variable used for testing purposes.
     */
    uint256 public test;

    /**
     * @notice Reserved storage slots for future upgrades to avoid storage collisions.
     */
    uint256[49] private __gap;

    /**
     * @notice Modifier to validate that an address is not the zero address.
     * @param addr Address to be checked.
     */
    modifier nonZeroAddress(address addr) {
        require(addr != address(0), "Bridge: Address must be not equal zero");
        _;
    }

    /**
     * @notice Modifier to validate that a bytes32 identifier is not zero.
     * @param _bytes The bytes32 value to be checked.
     */
    modifier nonZeroBytes32(bytes32 _bytes) {
        require(_bytes != bytes32(0), "Bridge: Bytes must be not equal zero");
        _;
    }

    /**
     * @notice Modifier to ensure a provided number is greater than zero.
     * @param num The number to check.
     */
    modifier nonZeroUint256(uint256 num) {
        require(num > 0, "Bridge: Cannot be zero");
        _;
    }

    /**
     * @notice Constructor to disable initializers for security reasons.
     * This is required for UUPS upgradeable contracts.
     */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Allows the contract to receive coins.
     * Triggered when coins is sent directly to the contract without any calldata.
     * Emits a {CoinsDeposited} event for tracking the deposit.
     */
    receive() external payable {
        emit CoinsDeposited({ account: msg.sender, amount: msg.value });
    }

    /**
     * @notice Initializes the contract with the given parameters.
     * This function can only be called once due to the `initializer` modifier.
     * @param initParams See {IBridge-InitParams}.
     */
    function initialize(InitParams calldata initParams) external initializer nonZeroAddress(initParams.mapperAddress) {
        __UUPSUpgradeable_init();
        __Ownable2Step_init();
        __ReentrancyGuard_init();

        require(
            ERC165Checker.supportsInterface({
                account: initParams.mapperAddress,
                interfaceId: type(IMapper).interfaceId
            }),
            "Bridge: New address does not support IMapper"
        );
        Mapper = IMapper(initParams.mapperAddress);
    }

    /**
     * @notice See {IBridge-bridgeTokens}.
     * @param bridgeTokensParams See {IBridge-BridgeTokensParams}.
     */
    function bridgeTokens(
        BridgeTokensParams calldata bridgeTokensParams
    )
        external
        payable
        nonReentrant
        nonZeroBytes32(bridgeTokensParams.bridgeParams.toAddress)
        nonZeroUint256(bridgeTokensParams.bridgeParams.amount)
    {
        IMapper.MapInfo memory _mapInfo = _getMapInfo({ mapId: bridgeTokensParams.bridgeParams.mapId });

        require(_mapInfo.isAllowed, "Bridge: IsAllowed must be true");
        require(_mapInfo.withdrawType == IMapper.WithdrawType.None, "Bridge: WithdrawType must be equal to None");

        uint256 _amount = bridgeTokensParams.bridgeParams.amount;

        uint256 _gasAmount;

        if (_mapInfo.isCoin) {
            require(msg.value >= _amount, "Bridge: The msg.value must be greater than or equal amount");
            _gasAmount = msg.value - _amount;
        } else {
            _gasAmount = msg.value;
        }

        bytes32 _hash = _validateECDSA({
            bridgeTokensParams: bridgeTokensParams,
            mapInfo: _mapInfo,
            gasAmount: _gasAmount
        });

        usedHashes[_hash] = true;
        gasAccumulated = gasAccumulated + _gasAmount;
        uint256 actualAmount;

        if (_mapInfo.isCoin) {
            require(_mapInfo.depositType == IMapper.DepositType.Lock, "Bridge: DepositType must be equal to Lock");
            actualAmount = _amount;
        } else {
            require(_mapInfo.depositType != IMapper.DepositType.None, "Bridge: DepositType must not be equal to None");

            uint256 balanceBefore = _getBalance({ tokenAddress: _mapInfo.originTokenAddress });

            _executeTokenTransferFrom({
                useTransfer: _mapInfo.useTransfer,
                tokenAddress: _mapInfo.originTokenAddress,
                from: msg.sender,
                to: address(this),
                amount: _amount
            });

            uint256 balanceAfter = _getBalance({ tokenAddress: _mapInfo.originTokenAddress });

            // Calculate the actual received amount
            actualAmount = balanceAfter - balanceBefore;

            if (_mapInfo.depositType == IMapper.DepositType.Burn) {
                ERC20BurnableUpgradeable(address(uint160(uint256(_mapInfo.originTokenAddress)))).burn({
                    amount: actualAmount
                });
            }
        }

        emit Deposit({
            fromAddress: bytes32(uint256(uint160(msg.sender))),
            toAddress: bridgeTokensParams.bridgeParams.toAddress,
            originTokenAddress: _mapInfo.originTokenAddress,
            targetTokenAddress: _mapInfo.targetTokenAddress,
            amount: actualAmount,
            originChainId: _mapInfo.originChainId,
            targetChainId: _mapInfo.targetChainId
        });
    }

    /**
     * @notice See {IBridge-receiveTokens}.
     * @param receiveTokensParams See {IBridge-ReceiveTokensParams}.
     */
    function receiveTokens(
        ReceiveTokensParams calldata receiveTokensParams
    )
        external
        nonReentrant
        onlyOwner
        nonZeroBytes32(receiveTokensParams.fromAddress)
        nonZeroBytes32(receiveTokensParams.toAddress)
        nonZeroUint256(receiveTokensParams.amount)
    {
        IMapper.MapInfo memory _mapInfo = _getMapInfo({ mapId: receiveTokensParams.mapId });

        require(_mapInfo.isAllowed, "Bridge: IsAllowed must be true");
        require(_mapInfo.depositType == IMapper.DepositType.None, "Bridge: DepositType must be equal to None");

        if (_mapInfo.isCoin) {
            require(
                _mapInfo.withdrawType == IMapper.WithdrawType.Unlock,
                "Bridge: WithdrawType must be equal to Unlock"
            );
            uint256 _contractBalance = address(this).balance - gasAccumulated;
            require(
                _contractBalance >= receiveTokensParams.amount,
                "Bridge: Contract coins balance must be greater or equal amount"
            );

            (bool success, ) = payable(address(uint160(uint256(receiveTokensParams.toAddress)))).call{
                value: receiveTokensParams.amount
            }("");

            require(success, "Bridge: Failed to send coins");
        } else {
            require(
                _mapInfo.withdrawType != IMapper.WithdrawType.None,
                "Bridge: WithdrawType must not be equal to None"
            );

            if (_mapInfo.withdrawType == IMapper.WithdrawType.Mint) {
                IERC20Mintable(address(uint160(uint256(_mapInfo.targetTokenAddress)))).mint({
                    to: address(uint160(uint256(receiveTokensParams.toAddress))),
                    amount: receiveTokensParams.amount
                });
            } else {
                _executeTokenTransfer({
                    useTransfer: _mapInfo.useTransfer,
                    tokenAddress: _mapInfo.targetTokenAddress,
                    to: address(uint160(uint256(receiveTokensParams.toAddress))),
                    amount: receiveTokensParams.amount
                });
            }
        }

        emit Withdrawal({
            fromAddress: receiveTokensParams.fromAddress,
            toAddress: receiveTokensParams.toAddress,
            targetTokenAddress: _mapInfo.targetTokenAddress,
            originTokenAddress: _mapInfo.originTokenAddress,
            externalId: receiveTokensParams.externalId,
            amount: receiveTokensParams.amount,
            originChainId: _mapInfo.originChainId,
            targetChainId: _mapInfo.targetChainId
        });
    }

    /**
     * @notice See {IBridge-withdrawGasAccumulated}.
     */
    function withdrawGasAccumulated() external nonReentrant onlyOwner nonZeroUint256(gasAccumulated) {
        require(
            address(this).balance >= gasAccumulated,
            "Bridge: Coins balance must be greater or equal gasAccumulated"
        );
        uint256 amount = gasAccumulated;

        gasAccumulated = 0;
        (bool success, ) = payable(owner()).call{ value: amount }("");
        require(success, "Bridge: Gas accumulated withdrawal failed");

        emit GasAccumulatedWithdrawn({ account: owner(), amount: amount });
    }

    /**
     * @notice See {IBridge-withdrawTokenLiquidity}.
     * @param withdrawTokenLiquidityParams See {IBridge-WithdrawTokenLiquidityParams}.
     */
    function withdrawTokenLiquidity(
        WithdrawTokenLiquidityParams calldata withdrawTokenLiquidityParams
    )
        external
        nonReentrant
        onlyOwner
        nonZeroUint256(withdrawTokenLiquidityParams.amount)
        nonZeroAddress(withdrawTokenLiquidityParams.recipientAddress)
        nonZeroBytes32(withdrawTokenLiquidityParams.tokenAddress)
    {
        _executeTokenTransfer({
            useTransfer: withdrawTokenLiquidityParams.useTransfer,
            tokenAddress: withdrawTokenLiquidityParams.tokenAddress,
            to: withdrawTokenLiquidityParams.recipientAddress,
            amount: withdrawTokenLiquidityParams.amount
        });

        emit LiquidityTokenWithdrawn({
            account: withdrawTokenLiquidityParams.recipientAddress,
            token: address(uint160(uint256(withdrawTokenLiquidityParams.tokenAddress))),
            amount: withdrawTokenLiquidityParams.amount,
            useTransfer: withdrawTokenLiquidityParams.useTransfer
        });
    }

    /**
     * @notice See {IBridge-withdrawCoinLiquidity}.
     * @param withdrawCoinLiquidityParams See {IBridge-WithdrawCoinLiquidityParams}.
     */
    function withdrawCoinLiquidity(
        WithdrawCoinLiquidityParams calldata withdrawCoinLiquidityParams
    )
        external
        nonReentrant
        onlyOwner
        nonZeroUint256(withdrawCoinLiquidityParams.amount)
        nonZeroAddress(withdrawCoinLiquidityParams.recipientAddress)
    {
        uint256 _contractBalance = address(this).balance - gasAccumulated;
        require(
            _contractBalance >= withdrawCoinLiquidityParams.amount,
            "Bridge: Contract coins balance must be greater or equal amount"
        );

        (bool success, ) = payable(withdrawCoinLiquidityParams.recipientAddress).call{
            value: withdrawCoinLiquidityParams.amount
        }("");

        require(success, "Bridge: Failed to send coins");

        emit LiquidityCoinWithdrawn({
            account: withdrawCoinLiquidityParams.recipientAddress,
            amount: withdrawCoinLiquidityParams.amount
        });
    }

    /**
     * @notice Allows users to deposit tokens into the contract.
     * Requires prior approval from the user.
     * Only the contract owner can call this function.
     * Emits a {TokensDeposited} event.
     * @param mapId The ID of the token mapping in the Mapper contract.
     * @param amount Amount of tokens to deposit.
     */
    function depositTokens(uint256 mapId, uint256 amount) external nonReentrant onlyOwner nonZeroUint256(amount) {
        IMapper.MapInfo memory _mapInfo = _getMapInfo({ mapId: mapId });

        require(_mapInfo.isAllowed, "Bridge: IsAllowed must be true");
        require(!_mapInfo.isCoin, "Bridge: Deposit allowed only for token mappings");
        require(_mapInfo.depositType == IMapper.DepositType.None, "Bridge: DepositType must be equal to None");
        require(_mapInfo.targetTokenAddress != bytes32(0), "Bridge: TargetTokenAddress must be not equal zero");

        uint256 balanceBefore = _getBalance({ tokenAddress: _mapInfo.targetTokenAddress });

        _executeTokenTransferFrom({
            useTransfer: _mapInfo.useTransfer,
            tokenAddress: _mapInfo.targetTokenAddress,
            from: msg.sender,
            to: address(this),
            amount: amount
        });

        uint256 balanceAfter = _getBalance({ tokenAddress: _mapInfo.targetTokenAddress });

        // Calculate the actual received amount
        uint256 actualAmount = balanceAfter - balanceBefore;

        emit TokensDeposited({
            account: msg.sender,
            token: address(uint160(uint256(_mapInfo.targetTokenAddress))),
            amount: actualAmount
        });
    }

    /**
     * @notice Allows users to deposit coins into the contract.
     * Only the contract owner can call this function.
     * Emits a {CoinsDeposited} event.
     */
    function depositCoins() external payable onlyOwner nonZeroUint256(msg.value) {
        emit CoinsDeposited({ account: msg.sender, amount: msg.value });
    }

    /**
     * @notice Changes the address of the Mapper contract.
     * Only the contract owner can call this function.
     * Emits a {MapperAddressChanged} event on success.
     * @param _newMapperAddress The new address of the Mapper contract.
     */
    function changeMapperAddress(address _newMapperAddress) external onlyOwner nonZeroAddress(_newMapperAddress) {
        require(
            ERC165Checker.supportsInterface({ account: _newMapperAddress, interfaceId: type(IMapper).interfaceId }),
            "Bridge: New address does not support IMapper"
        );
        address _oldMapperAddress = address(Mapper);
        Mapper = IMapper(_newMapperAddress);
        emit MapperAddressChanged({
            account: msg.sender,
            oldAddress: _oldMapperAddress,
            newAddress: _newMapperAddress
        });
    }

    /**
     * @notice Authorizes the upgrade of the contract to a new implementation.
     * This function overrides `_authorizeUpgrade` from UUPSUpgradeable.
     * Only the contract owner can authorize an upgrade.
     * @param newImplementation Address of the new implementation contract.
     */
    function _authorizeUpgrade(address newImplementation) internal override(UUPSUpgradeable) onlyOwner {}

    /**
     * @notice Executes a token transfer from this contract to the specified recipient.
     * Supports both standard `transfer` and `safeTransfer` methods.
     * The token address is passed as `bytes32` and converted back to `address`.
     * @param useTransfer If true, uses the standard `transfer`.
     * @param tokenAddress The token contract address, stored as bytes32.
     * @param to The recipient address that will receive the tokens.
     * @param amount The number of tokens to transfer.
     */
    function _executeTokenTransfer(bool useTransfer, bytes32 tokenAddress, address to, uint256 amount) private {
        if (useTransfer) {
            IERC20Upgradeable(address(uint160(uint256(tokenAddress)))).transfer({ to: to, amount: amount });
        } else {
            IERC20Upgradeable(address(uint160(uint256(tokenAddress)))).safeTransfer({ to: to, value: amount });
        }
    }

    /**
     * @notice Executes a token transfer from this contract to the specified recipient.
     * Supports both standard `transfer` and `safeTransfer` methods.
     * The token address is passed as `bytes32` and converted back to `address`.
     * @param useTransfer If true, uses the standard `transfer`.
     * @param tokenAddress The token contract address, stored as bytes32.
     * @param from The address from which the tokens will be transferred.
     * @param to The recipient address that will receive the tokens.
     * @param amount The number of tokens to transfer.
     */
    function _executeTokenTransferFrom(
        bool useTransfer,
        bytes32 tokenAddress,
        address from,
        address to,
        uint256 amount
    ) private {
        if (useTransfer) {
            IERC20Upgradeable(address(uint160(uint256(tokenAddress)))).transferFrom({
                from: from,
                to: to,
                amount: amount
            });
        } else {
            IERC20Upgradeable(address(uint160(uint256(tokenAddress)))).safeTransferFrom({
                from: from,
                to: to,
                value: amount
            });
        }
    }

    /**
     * @notice Reads mapping info from Mapper and packs it into IMapper.MapInfo.
     * @param mapId The ID of the token mapping in the Mapper contract.
     * @return info Fully populated MapInfo struct.
     */
    function _getMapInfo(uint256 mapId) private view returns (IMapper.MapInfo memory info) {
        (
            uint256 originChainId,
            uint256 targetChainId,
            IMapper.DepositType depositType,
            IMapper.WithdrawType withdrawType,
            bytes32 originTokenAddress,
            bytes32 targetTokenAddress,
            bool useTransfer,
            bool isAllowed,
            bool isCoin
        ) = Mapper.mapInfo(mapId);

        return
            IMapper.MapInfo({
                originChainId: originChainId,
                targetChainId: targetChainId,
                depositType: depositType,
                withdrawType: withdrawType,
                originTokenAddress: originTokenAddress,
                targetTokenAddress: targetTokenAddress,
                useTransfer: useTransfer,
                isAllowed: isAllowed,
                isCoin: isCoin
            });
    }

    /**
     * @notice Returns the contract's current balance of the specified token.
     * Converts a stored `bytes32` token address back to a normal `address`
     * and calls `balanceOf(address(this))` on the token contract.
     * @param tokenAddress The token contract address, stored as bytes32.
     * @return balance The amount of tokens held by this contract.
     */
    function _getBalance(bytes32 tokenAddress) private view returns (uint256 balance) {
        return IERC20Upgradeable(address(uint160(uint256(tokenAddress)))).balanceOf({ account: address(this) });
    }

    /**
     * @notice Validates the ECDSA signature and returns the computed message hash.
     *  - Computes a unique hash from all critical parameters of the bridging request.
     *  - Ensures the hash has not been used before to prevent replay attacks.
     *  - Recovers the signer address from the signature and verifies it matches the contract owner.
     * @param bridgeTokensParams Struct containing parameters for the bridging process.
     * @param mapInfo Struct containing detailed information about the mapping.
     * @param gasAmount The amount of gas fee to be paid.
     * @return hash The computed keccak256 hash of the signed message.
     */
    function _validateECDSA(
        BridgeTokensParams calldata bridgeTokensParams,
        IMapper.MapInfo memory mapInfo,
        uint256 gasAmount
    ) private view returns (bytes32 hash) {
        // Recovering the address of the signer from the signature
        hash = keccak256(
            abi.encodePacked(
                owner(),
                msg.sender,
                bridgeTokensParams.bridgeParams.toAddress,
                mapInfo.targetTokenAddress,
                gasAmount,
                bridgeTokensParams.bridgeParams.amount,
                mapInfo.originChainId,
                mapInfo.targetChainId,
                bridgeTokensParams.ECDSAParams.deadline,
                bridgeTokensParams.ECDSAParams.salt
            )
        );

        require(!usedHashes[hash], "Bridge: Hash already used");

        // We do an ECDSA check
        ECDSAChecks.validate(
            ECDSAChecks.ECDSAParams({
                hash: hash,
                r: bridgeTokensParams.ECDSAParams.r,
                s: bridgeTokensParams.ECDSAParams.s,
                signerAddress: owner(),
                deadline: bridgeTokensParams.ECDSAParams.deadline,
                v: bridgeTokensParams.ECDSAParams.v
            })
        );

        return hash;
    }
}

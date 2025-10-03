
/**
 * @dev Struct for initializing the Bridge contract.
 * @param mapperAddress Address of the Mapper contract used for token mapping.
 */
export interface InitParams {
    mapperAddress: string;
}

/**
 * @dev Struct for storing parameters of an ECDSA signature.
 * @param r Part of the ECDSA signature.
 * @param s Part of the ECDSA signature.
 * @param salt A random value that allows creating different signatures for the same message having
 * replay attack protection at the same time.
 * @param deadline Expiration timestamp for the signature.
 * @param v Recovery byte of the signature.
 */
export interface ECDSAParams {
    r: string;
    s: string;
    salt: string;
    deadline: bigint;
    v: bigint;
}

/**
 * @dev Struct for storing parameters of a token bridge request.
 * @param mapId ID of the token mapping in the Mapper contract.
 * @param amount Amount of tokens to be bridged.
 * @param toAddress Recipient's address on the target chain.
 */
export interface BridgeParams {
    mapId: bigint;
    amount: bigint;
    toAddress: string;
}

/**
 * @dev Struct for storing parameters of a token receiving request.
 * @param externalId External identifier for tracking the bridge transaction.
 * @param mapId ID of the token mapping in the Mapper contract.
 * @param amount Amount of tokens to be received.
 * @param fromAddress Sender's address on the origin chain.
 * @param toAddress Recipient's address on the target chain.
 */
export interface ReceiveTokensParams {
    externalId: string;
    mapId: bigint;
    amount: bigint;
    fromAddress: string;
    toAddress: string;
}

/**
 * @dev Struct for combining bridge parameters with ECDSA signature parameters.
 * @param bridgeParams Struct containing token bridge details.
 * @param ECDSAParams Struct containing ECDSA signature details.
 */
export interface BridgeTokensParams {
    bridgeParams: BridgeParams;
    ECDSAParams : ECDSAParams;
}

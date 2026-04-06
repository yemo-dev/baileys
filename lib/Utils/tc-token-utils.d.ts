export const __esModule: boolean;
/**
 * Check if a TC token is expired using rolling bucket algorithm.
 * cutoff = (floor(now / bucketSize) - (numBuckets - 1)) × bucketSize
 * @param {number|string|undefined} timestamp
 * @param {'sender'|'receiver'} [mode]
 */
export function isTcTokenExpired(timestamp: number | string | undefined, mode?: "sender" | "receiver"): boolean;
/**
 * Returns true when we have crossed a bucket boundary since the last issuance,
 * meaning a new TC token should be sent to the server.
 * @param {number|string|null|undefined} senderTimestamp
 */
export function shouldSendNewTcToken(senderTimestamp: number | string | null | undefined): boolean;
/**
 * Build a tctoken BinaryNode from authState for a given JID.
 * @param {{ authState: { keys: any }, jid: string }} params
 * @returns {Promise<{ tokenNode: object|null, senderTimestamp: number|string|null }>}
 */
export function buildTcTokenFromJid({ authState, jid }: {
    authState: {
        keys: any;
    };
    jid: string;
}): Promise<{
    tokenNode: object | null;
    senderTimestamp: number | string | null;
}>;
/**
 * Compute CS Token as HMAC-SHA256(nctSalt, UTF-8(recipientLid)).
 * Uses a small LRU cache to avoid recomputing on every message.
 * @param {Uint8Array|Buffer} nctSalt — must be exactly 32 bytes
 * @param {string} recipientLid
 * @returns {Uint8Array}
 */
export function computeCsToken(nctSalt: Uint8Array | Buffer, recipientLid: string): Uint8Array;
export function clearCsTokenCache(): void;
/**
 * Parse and store TC tokens from a privacy_token notification node.
 * Includes monotonicity guard: rejects tokens with older timestamps.
 * @param {{ node: object, keys: any, onNewJidStored?: (jid: string) => void }} params
 * @returns {Promise<number>} number of tokens stored
 */
export function storeTcTokensFromNotification({ node, keys, onNewJidStored }: {
    node: object;
    keys: any;
    onNewJidStored?: (jid: string) => void;
}): Promise<number>;
/**
 * Prune expired TC tokens from the key store (periodic cleanup, every 24h).
 * @param {any} keys
 * @param {Set<string>} knownJids
 * @returns {Promise<number>}
 */
export function pruneExpiredTcTokens(keys: any, knownJids: Set<string>): Promise<number>;

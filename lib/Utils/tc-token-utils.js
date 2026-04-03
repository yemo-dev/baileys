"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTcTokenExpired = isTcTokenExpired;
exports.shouldSendNewTcToken = shouldSendNewTcToken;
exports.buildTcTokenFromJid = buildTcTokenFromJid;
exports.computeCsToken = computeCsToken;
exports.clearCsTokenCache = clearCsTokenCache;
exports.storeTcTokensFromNotification = storeTcTokensFromNotification;
exports.pruneExpiredTcTokens = pruneExpiredTcTokens;

const { createHmac } = require('crypto');
const { getBinaryNodeChild, getBinaryNodeChildren, jidNormalizedUser } = require('../WABinary');

/** 7 days in seconds — matching WA Web tctoken_duration AB prop */
const TC_SENDER_BUCKET_SIZE = 604800;
/** Number of rolling buckets for sender mode — matching WA Web tctoken_num_buckets_sender */
const TC_SENDER_NUM_BUCKETS = 4;
/** 7 days in seconds — matching WA Web tctoken_duration AB prop */
const TC_RECEIVER_BUCKET_SIZE = 604800;
/** Number of rolling buckets for receiver mode — matching WA Web tctoken_num_buckets */
const TC_RECEIVER_NUM_BUCKETS = 4;

/**
 * LRU cache for cstoken to avoid recomputing HMAC-SHA256 on every message.
 * Capped at 5 entries to match WA Web (var L=5 in WAWebSendMsgCreateFanoutStanza).
 */
const CS_TOKEN_CACHE_MAX = 5;
const csTokenCache = new Map();

function getBucketConfig(mode) {
    if (mode === 'sender') {
        return { bucketSize: TC_SENDER_BUCKET_SIZE, numBuckets: TC_SENDER_NUM_BUCKETS };
    }
    return { bucketSize: TC_RECEIVER_BUCKET_SIZE, numBuckets: TC_RECEIVER_NUM_BUCKETS };
}

/**
 * Check if a TC token is expired using rolling bucket algorithm.
 * cutoff = (floor(now / bucketSize) - (numBuckets - 1)) × bucketSize
 * @param {number|string|undefined} timestamp
 * @param {'sender'|'receiver'} [mode]
 */
function isTcTokenExpired(timestamp, mode = 'receiver') {
    if (!timestamp) return true;
    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    if (!ts || ts <= 0) return true;
    const { bucketSize, numBuckets } = getBucketConfig(mode);
    const now = Math.floor(Date.now() / 1000);
    const currentBucket = Math.floor(now / bucketSize);
    const cutoff = (currentBucket - (numBuckets - 1)) * bucketSize;
    return ts < cutoff;
}

/**
 * Returns true when we have crossed a bucket boundary since the last issuance,
 * meaning a new TC token should be sent to the server.
 * @param {number|string|null|undefined} senderTimestamp
 */
function shouldSendNewTcToken(senderTimestamp) {
    if (!senderTimestamp) return true;
    const ts = typeof senderTimestamp === 'string' ? parseInt(senderTimestamp, 10) : senderTimestamp;
    if (!ts || ts <= 0) return true;
    const { bucketSize } = getBucketConfig('sender');
    const now = Math.floor(Date.now() / 1000);
    const currentBucket = Math.floor(now / bucketSize);
    const tokenBucket = Math.floor(ts / bucketSize);
    return currentBucket > tokenBucket;
}

/**
 * Build a tctoken BinaryNode from authState for a given JID.
 * @param {{ authState: { keys: any }, jid: string }} params
 * @returns {Promise<{ tokenNode: object|null, senderTimestamp: number|string|null }>}
 */
async function buildTcTokenFromJid({ authState, jid }) {
    const normalizedJid = jidNormalizedUser(jid);
    let tokenNode = null;
    let senderTimestamp = null;

    try {
        const tcTokenData = await authState.keys.get('tctoken', [normalizedJid]);
        const data = tcTokenData?.[normalizedJid];
        if (data?.token) {
            if (!isTcTokenExpired(data.timestamp, 'receiver')) {
                tokenNode = { tag: 'tctoken', attrs: {}, content: data.token };
            } else {
                await authState.keys.set({ tctoken: { [normalizedJid]: null } });
            }
        }
    } catch {
        // tctoken failure must not break the caller
    }

    try {
        const senderTsData = await authState.keys.get('tctoken-sender-ts', [normalizedJid]);
        const storedTs = senderTsData?.[normalizedJid];
        if (storedTs) senderTimestamp = storedTs;
    } catch {
        // ignore
    }

    return { tokenNode, senderTimestamp };
}

/**
 * Compute CS Token as HMAC-SHA256(nctSalt, UTF-8(recipientLid)).
 * Uses a small LRU cache to avoid recomputing on every message.
 * @param {Uint8Array|Buffer} nctSalt — must be exactly 32 bytes
 * @param {string} recipientLid
 * @returns {Uint8Array}
 */
function computeCsToken(nctSalt, recipientLid) {
    if ((nctSalt?.length ?? 0) !== 32) {
        throw new Error(`Invalid nctSalt length: expected 32, got ${nctSalt?.length ?? 0}`);
    }
    const cached = csTokenCache.get(recipientLid);
    if (cached) return cached;
    const hmac = createHmac('sha256', Buffer.from(nctSalt));
    hmac.update(recipientLid, 'utf8');
    const token = new Uint8Array(hmac.digest());
    if (csTokenCache.size >= CS_TOKEN_CACHE_MAX) {
        const firstKey = csTokenCache.keys().next().value;
        csTokenCache.delete(firstKey);
    }
    csTokenCache.set(recipientLid, token);
    return token;
}

function clearCsTokenCache() {
    csTokenCache.clear();
}

async function shouldRejectToken(keys, jid, incomingTs) {
    try {
        const existing = await keys.get('tctoken', [jid]);
        const existingData = existing?.[jid];
        if (!existingData?.timestamp) return false;
        const existingTs = parseInt(existingData.timestamp, 10);
        if (existingTs <= 0) return false;
        return incomingTs <= 0 || incomingTs < existingTs;
    } catch {
        return false;
    }
}

/**
 * Parse and store TC tokens from a privacy_token notification node.
 * Includes monotonicity guard: rejects tokens with older timestamps.
 * @param {{ node: object, keys: any, onNewJidStored?: (jid: string) => void }} params
 * @returns {Promise<number>} number of tokens stored
 */
async function storeTcTokensFromNotification({ node, keys, onNewJidStored }) {
    const tokensNode = getBinaryNodeChild(node, 'tokens');
    const fallbackFrom = jidNormalizedUser(node.attrs.from);
    if (!tokensNode) return 0;
    const tokenNodes = getBinaryNodeChildren(tokensNode, 'token');
    let storedCount = 0;
    for (const tokenNode of tokenNodes) {
        const { attrs, content } = tokenNode;
        if (attrs.type !== 'trusted_contact' || !(Buffer.isBuffer(content) || content instanceof Uint8Array)) {
            continue;
        }
        const tokenJid = attrs.jid ? jidNormalizedUser(attrs.jid) : fallbackFrom;
        const tokenBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
        const incomingTs = attrs.t ? parseInt(String(attrs.t), 10) : 0;
        if (await shouldRejectToken(keys, tokenJid, incomingTs)) continue;
        await keys.set({
            tctoken: { [tokenJid]: { token: tokenBuffer, timestamp: incomingTs > 0 ? String(incomingTs) : undefined } }
        });
        storedCount++;
        onNewJidStored?.(tokenJid);
    }
    return storedCount;
}

/**
 * Prune expired TC tokens from the key store (periodic cleanup, every 24h).
 * @param {any} keys
 * @param {Set<string>} knownJids
 * @returns {Promise<number>}
 */
async function pruneExpiredTcTokens(keys, knownJids) {
    let pruned = 0;
    for (const jid of knownJids) {
        try {
            const data = await keys.get('tctoken', [jid]);
            const tokenData = data?.[jid];
            if (tokenData?.timestamp && isTcTokenExpired(tokenData.timestamp, 'receiver')) {
                await keys.set({ tctoken: { [jid]: null } });
                knownJids.delete(jid);
                pruned++;
            }
        } catch {
            // ignore errors during pruning
        }
    }
    return pruned;
}

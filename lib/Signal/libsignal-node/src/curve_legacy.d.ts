export const __esModule: boolean;
declare const _default: {};
export default _default;
/**
 * Returns a raw shared key between own private key and peer's public key (in other words, this is an ECC Diffie-Hellman function X25519, performing scalar multiplication).
 *
 * The result should not be used directly as a key, but should be processed with a one-way function (e.g. HSalsa20 as in NaCl, or any secure cryptographic hash function, such as SHA-256, or key derivation function, such as HKDF).
 *
 * @export
 * @param {Uint8Array} secretKey
 * @param {Uint8Array} publicKey
 * @returns Uint8Array
 */
export function sharedKey(secretKey: Uint8Array, publicKey: Uint8Array): Uint8Array<ArrayBuffer>;
/**
 * Signs the given message using the private key and returns a signed message (signature concatenated with the message copy).
 *
 * Optional random data argument (which must have 64 random bytes) turns on hash separation and randomization to make signatures non-deterministic.
 *
 * @export
 * @param {Uint8Array} secretKey
 * @param {*} msg
 * @param {Uint8Array} opt_random
 * @returns
 */
export function signMessage(secretKey: Uint8Array, msg: any, opt_random: Uint8Array): Uint8Array<any>;
/**
 * Verifies signed message with the public key and returns the original message without signature if it's correct or null if verification fails.
 *
 * @export
 * @param {Uint8Array} publicKey
 * @param {*} signedMsg
 * @returns Message
 */
export function openMessage(publicKey: Uint8Array, signedMsg: any): Uint8Array<any>;
/**
 * Signs the given message using the private key and returns signature.
 *
 * Optional random data argument (which must have 64 random bytes) turns on hash separation and randomization to make signatures non-deterministic.
 *
 * @export
 * @param {Uint8Array} secretKey
 * @param {*} msg
 * @param {Uint8Array} opt_random
 * @returns
 */
export function sign(secretKey: Uint8Array, msg: any, opt_random: Uint8Array): Uint8Array<ArrayBuffer>;
/**
 * Verifies the given signature for the message using the given private key. Returns true if the signature is valid, false otherwise.
 *
 * @export
 * @param {Uint8Array} publicKey
 * @param {*} msg
 * @param {*} signature
 * @returns
 */
export function verify(publicKey: Uint8Array, msg: any, signature: any): boolean;
/**
 * Generates a new key pair from the given 32-byte secret seed (which should be generated with a CSPRNG) and returns it as object.
 *
 * The returned keys can be used for signing and key agreement.
 *
 * @export
 * @param {Uint8Array} seed required
 * @returns
 */
export function generateKeyPair(seed: Uint8Array): {
    public: Uint8Array<ArrayBuffer>;
    private: Uint8Array<ArrayBuffer>;
};

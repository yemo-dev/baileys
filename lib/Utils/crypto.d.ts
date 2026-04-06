export const __esModule: boolean;
export namespace Curve {
    function generateKeyPair(): {
        private: any;
        public: any;
    };
    function sharedKey(privateKey: any, publicKey: any): any;
    function sign(privateKey: any, buf: any): any;
    function verify(pubKey: any, message: any, signature: any): boolean;
}
export function aesEncryptGCM(plaintext: any, key: any, iv: any, additionalData: any): any;
export function aesDecryptGCM(ciphertext: any, key: any, iv: any, additionalData: any): any;
export function aesEncryptCTR(plaintext: any, key: any, iv: any): any;
export function aesDecryptCTR(ciphertext: any, key: any, iv: any): any;
export function aesDecrypt(buffer: any, key: any): any;
export function aesDecryptWithIV(buffer: any, key: any, IV: any): any;
export function aesEncrypt(buffer: any, key: any): any;
export function aesEncrypWithIV(buffer: any, key: any, IV: any): any;
export function hmacSign(buffer: any, key: any, variant?: string): any;
export function sha256(buffer: any): any;
export function md5(buffer: any): any;
export function hkdf(buffer: any, expandedLength: any, info: any): Promise<any>;
export function derivePairingCodeKey(pairingCode: any, salt: any): Promise<any>;
export function generateSignalPubKey(pubKey: any): any;
export function signedKeyPair(identityKeyPair: any, keyId: any): {
    keyPair: {
        private: any;
        public: any;
    };
    signature: any;
    keyId: any;
};

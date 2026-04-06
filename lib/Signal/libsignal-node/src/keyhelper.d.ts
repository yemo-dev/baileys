export { generateKeyPair as generateIdentityKeyPair };
export function generateRegistrationId(): number;
export function generateSignedPreKey(identityKeyPair: any, signedKeyId: any): {
    keyId: any;
    keyPair: {
        pubKey: any;
        privKey: any;
    };
    signature: any;
};
export function generatePreKey(keyId: any): {
    keyId: any;
    keyPair: {
        pubKey: any;
        privKey: any;
    };
};

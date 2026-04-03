export const __esModule: boolean;
export class SenderKeyMessage extends ciphertext_message_1.CiphertextMessage {
    constructor(keyId: any, iteration: any, ciphertext: any, signatureKey: any, serialized: any);
    SIGNATURE_LENGTH: number;
    serialized: any;
    messageVersion: number;
    keyId: any;
    iteration: any;
    ciphertext: any;
    signature: any;
    getKeyId(): any;
    getIteration(): any;
    getCipherText(): any;
    verifySignature(signatureKey: any): void;
    getSignature(signatureKey: any, serialized: any): Buffer<any>;
    serialize(): any;
    getType(): number;
}
import ciphertext_message_1 = require("./ciphertext-message");

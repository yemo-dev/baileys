export const __esModule: boolean;
export class SenderKeyState {
    constructor(id: any, iteration: any, chainKey: any, signatureKeyPair: any, signatureKeyPublic: any, signatureKeyPrivate: any, senderKeyStateStructure: any);
    MAX_MESSAGE_KEYS: number;
    senderKeyStateStructure: any;
    getKeyId(): any;
    getSenderChainKey(): sender_chain_key_1.SenderChainKey;
    setSenderChainKey(chainKey: any): void;
    getSigningKeyPublic(): Buffer<any>;
    getSigningKeyPrivate(): Buffer<any>;
    hasSenderMessageKey(iteration: any): any;
    addSenderMessageKey(senderMessageKey: any): void;
    removeSenderMessageKey(iteration: any): sender_message_key_1.SenderMessageKey;
    getStructure(): any;
}
import sender_chain_key_1 = require("./sender-chain-key");
import sender_message_key_1 = require("./sender-message-key");

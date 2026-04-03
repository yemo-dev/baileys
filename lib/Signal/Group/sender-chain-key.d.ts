export const __esModule: boolean;
export class SenderChainKey {
    constructor(iteration: any, chainKey: any);
    MESSAGE_KEY_SEED: Buffer<ArrayBuffer>;
    CHAIN_KEY_SEED: Buffer<ArrayBuffer>;
    iteration: any;
    chainKey: Buffer<any>;
    getIteration(): any;
    getSenderMessageKey(): sender_message_key_1.SenderMessageKey;
    getNext(): SenderChainKey;
    getSeed(): Buffer<any>;
    getDerivative(seed: any, key: any): any;
}
import sender_message_key_1 = require("./sender-message-key");

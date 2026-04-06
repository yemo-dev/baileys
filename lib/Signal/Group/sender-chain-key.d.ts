export const __esModule: boolean;
export class SenderChainKey {
    constructor(iteration: any, chainKey: any);
    MESSAGE_KEY_SEED: any;
    CHAIN_KEY_SEED: any;
    iteration: any;
    chainKey: any;
    getIteration(): any;
    getSenderMessageKey(): sender_message_key_1.SenderMessageKey;
    getNext(): SenderChainKey;
    getSeed(): any;
    getDerivative(seed: any, key: any): any;
}
import sender_message_key_1 = require("./sender-message-key");

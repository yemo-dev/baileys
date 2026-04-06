export const __esModule: boolean;
export class SenderKeyDistributionMessage extends ciphertext_message_1.CiphertextMessage {
    constructor(id: any, iteration: any, chainKey: any, signatureKey: any, serialized: any);
    serialized: any;
    id: any;
    iteration: any;
    chainKey: any;
    signatureKey: any;
    intsToByteHighAndLow(highValue: any, lowValue: any): number;
    serialize(): any;
    getType(): number;
    getIteration(): any;
    getChainKey(): any;
    getSignatureKey(): any;
    getId(): any;
}
import ciphertext_message_1 = require("./ciphertext-message");

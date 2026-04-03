export const __esModule: boolean;
export class SenderKeyRecord {
    static deserialize(data: any): SenderKeyRecord;
    constructor(serialized: any);
    MAX_STATES: number;
    senderKeyStates: sender_key_state_1.SenderKeyState[];
    isEmpty(): boolean;
    getSenderKeyState(keyId: any): sender_key_state_1.SenderKeyState;
    addSenderKeyState(id: any, iteration: any, chainKey: any, signatureKey: any): void;
    setSenderKeyState(id: any, iteration: any, chainKey: any, keyPair: any): void;
    serialize(): any[];
}
import sender_key_state_1 = require("./sender-key-state");

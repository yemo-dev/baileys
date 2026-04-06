export const __esModule: boolean;
export class GroupSessionBuilder {
    constructor(senderKeyStore: any);
    senderKeyStore: any;
    process(senderKeyName: any, senderKeyDistributionMessage: any): Promise<void>;
    create(senderKeyName: any): Promise<sender_key_distribution_message_1.SenderKeyDistributionMessage>;
}
import sender_key_distribution_message_1 = require("./sender-key-distribution-message");

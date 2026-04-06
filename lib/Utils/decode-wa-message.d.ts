export const __esModule: boolean;
export const NO_MESSAGE_FOUND_ERROR_TEXT: "Message absent from node";
export const MISSING_KEYS_ERROR_TEXT: "Key used already or never filled";
export const ACCOUNT_RESTRICTED_TEXT: "Your account has been restricted";
export namespace NACK_REASONS {
    let SenderReachoutTimelocked: number;
    let ParsingError: number;
    let UnrecognizedStanza: number;
    let UnrecognizedStanzaClass: number;
    let UnrecognizedStanzaType: number;
    let InvalidProtobuf: number;
    let InvalidHostedCompanionStanza: number;
    let MissingMessageSecret: number;
    let SignalErrorOldCounter: number;
    let MessageDeletedOnPeer: number;
    let UnhandledError: number;
    let UnsupportedAdminRevoke: number;
    let UnsupportedLIDGroup: number;
    let DBOperationFailed: number;
}
/**
 * Parses the inbound node. When WhatsApp sends both PN and LID, keys use LID as the primary
 * address (remoteJid / participant) and put PN on *Alt fields, consistent with lidMapping LID↔PN storage.
 */
export function decodeMessageNode(stanza: any, meId: any, meLid: any): {
    fullMessage: {
        key: {
            remoteJid: any;
            remoteJidAlt: any;
            fromMe: any;
            id: any;
            senderPn: any;
            senderLid: any;
            lid: any;
            participant: any;
            participantAlt: any;
            participantLid: any;
            addressingMode: any;
            server_id: any;
        };
        messageTimestamp: number;
        pushName: any;
        broadcast: any;
    };
    author: any;
    sender: any;
};
export function getDecryptionJid(sender: any, repository: any): Promise<any>;
export function decryptMessageNode(stanza: any, meId: any, meLid: any, repository: any, logger: any): {
    fullMessage: {
        key: {
            remoteJid: any;
            remoteJidAlt: any;
            fromMe: any;
            id: any;
            senderPn: any;
            senderLid: any;
            lid: any;
            participant: any;
            participantAlt: any;
            participantLid: any;
            addressingMode: any;
            server_id: any;
        };
        messageTimestamp: number;
        pushName: any;
        broadcast: any;
    };
    category: any;
    author: any;
    decrypt(): Promise<void>;
};
/**
 * Derives PN/LID alternates from stanza attrs (same rules as WhiskeySockets Baileys).
 */
export function extractAddressingContext(stanza: any): {
    addressingMode: any;
    senderAlt: any;
    recipientAlt: any;
};

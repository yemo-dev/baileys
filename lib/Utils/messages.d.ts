export const __esModule: boolean;
export function getAggregateVotesInPollMessage({ message, pollUpdates }: {
    message: any;
    pollUpdates: any;
}, meId: any): any[];
export function extractUrlFromText(text: any): any;
export function generateLinkPreviewIfRequired(text: any, getUrlInfo: any, logger: any): Promise<any>;
export function prepareWAMessageMedia(message: any, options: any): Promise<any>;
export function prepareDisappearingMessageSettingContent(ephemeralExpiration: any): any;
export function generateForwardMessageContent(message: any, forceForward: any): any;
export function generateWAMessageContent(message: any, options: any): Promise<any>;
export function generateWAMessageFromContent(jid: any, message: any, options: any): any;
export function generateWAMessage(jid: any, content: any, options: any): Promise<any>;
export function getContentType(content: any): string;
export function normalizeMessageContent(content: any): any;
export function extractMessageContent(content: any): any;
export function getDevice(id: any): "web" | "unknown" | "android" | "ios" | "desktop";
export function updateMessageWithReceipt(msg: any, receipt: any): void;
export function updateMessageWithReaction(msg: any, reaction: any): void;
export function updateMessageWithPollUpdate(msg: any, update: any): void;
export function aggregateMessageKeysNotFromMe(keys: any): any[];
export function downloadMediaMessage(message: any, type: any, options: any, ctx: any): Promise<any>;
export function assertMediaContent(content: any): any;
/**
 * Normalizes a bare user id to @s.whatsapp.net. Does not convert LID↔PN; use lidMapping / PN in key.remoteJidAlt when needed.
 */
export function toJid(id: any): any;
/**
 * Returns the peer LID JID when the key is LID-primary (decode sets remoteJid/participant to @lid when WA sends LID).
 */
export function getSenderLid(message: any): {
    jid: any;
    lid: any;
};

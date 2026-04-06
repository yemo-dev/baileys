export const __esModule: boolean;
export default processMessage;
export function decryptPollVote({ encPayload, encIv }: {
    encPayload: any;
    encIv: any;
}, { pollCreatorJid, pollMsgId, pollEncKey, voterJid, }: {
    pollCreatorJid: any;
    pollMsgId: any;
    pollEncKey: any;
    voterJid: any;
}): any;
export function cleanMessage(message: any, meId: any): void;
export function isRealMessage(message: any, meId: any): boolean;
export function shouldIncrementChatUnread(message: any): boolean;
export function getChatId({ remoteJid, participant, fromMe }: {
    remoteJid: any;
    participant: any;
    fromMe: any;
}): any;
declare function processMessage(message: any, { signalRepository, shouldProcessHistoryMsg, placeholderResendCache, ev, creds, keyStore, logger, options, getMessage }: {
    signalRepository: any;
    shouldProcessHistoryMsg: any;
    placeholderResendCache: any;
    ev: any;
    creds: any;
    keyStore: any;
    logger: any;
    options: any;
    getMessage: any;
}): Promise<void>;

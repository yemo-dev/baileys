"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatId = exports.shouldIncrementChatUnread = exports.isRealMessage = exports.cleanMessage = void 0;
exports.decryptPollVote = decryptPollVote;
const WAProto_1 = require("../../WAProto");
const Types_1 = require("../Types");
const messages_1 = require("../Utils/messages");
const WABinary_1 = require("../WABinary");
const crypto_1 = require("./crypto");
const generics_1 = require("./generics");
const history_1 = require("./history");
const { clearCsTokenCache } = require("./tc-token-utils");
const REAL_MSG_STUB_TYPES = new Set([
    Types_1.WAMessageStubType.CALL_MISSED_GROUP_VIDEO,
    Types_1.WAMessageStubType.CALL_MISSED_GROUP_VOICE,
    Types_1.WAMessageStubType.CALL_MISSED_VIDEO,
    Types_1.WAMessageStubType.CALL_MISSED_VOICE
]);
const REAL_MSG_REQ_ME_STUB_TYPES = new Set([
    Types_1.WAMessageStubType.GROUP_PARTICIPANT_ADD
]);

const cleanMessage = (message, meId) => {
    
    
    try {
        message.key.remoteJid = (0, WABinary_1.jidNormalizedUser)(message.key.remoteJid);
    }
    catch (_e) {
        
    }
    if (message.key.participant) {
        try {
            message.key.participant = (0, WABinary_1.jidNormalizedUser)(message.key.participant);
        }
        catch (_e) {
            
        }
    }
    const content = (0, messages_1.normalizeMessageContent)(message.message);
    
    if (content === null || content === void 0 ? void 0 : content.reactionMessage) {
        normaliseKey(content.reactionMessage.key);
    }
    if (content === null || content === void 0 ? void 0 : content.pollUpdateMessage) {
        normaliseKey(content.pollUpdateMessage.pollCreationMessageKey);
    }
    function normaliseKey(msgKey) {
        
        
        if (!message.key.fromMe) {
            
            
            msgKey.fromMe = !msgKey.fromMe
                ? (0, WABinary_1.areJidsSameUser)(msgKey.participant || msgKey.remoteJid, meId)
                
                
                : false;
            
            msgKey.remoteJid = message.key.remoteJid;
            
            msgKey.participant = msgKey.participant || message.key.participant;
        }
    }
};
exports.cleanMessage = cleanMessage;
const isRealMessage = (message, meId) => {
    var _a;
    const normalizedContent = (0, messages_1.normalizeMessageContent)(message.message);
    const hasSomeContent = !!(0, messages_1.getContentType)(normalizedContent);
    return (!!normalizedContent
        || REAL_MSG_STUB_TYPES.has(message.messageStubType)
        || (REAL_MSG_REQ_ME_STUB_TYPES.has(message.messageStubType)
            && ((_a = message.messageStubParameters) === null || _a === void 0 ? void 0 : _a.some(p => (0, WABinary_1.areJidsSameUser)(meId, p)))))
        && hasSomeContent
        && !(normalizedContent === null || normalizedContent === void 0 ? void 0 : normalizedContent.protocolMessage)
        && !(normalizedContent === null || normalizedContent === void 0 ? void 0 : normalizedContent.reactionMessage)
        && !(normalizedContent === null || normalizedContent === void 0 ? void 0 : normalizedContent.pollUpdateMessage);
};
exports.isRealMessage = isRealMessage;
const shouldIncrementChatUnread = (message) => (!message.key.fromMe && !message.messageStubType);
exports.shouldIncrementChatUnread = shouldIncrementChatUnread;

const getChatId = ({ remoteJid, participant, fromMe }) => {
    if ((0, WABinary_1.isJidBroadcast)(remoteJid)
        && !(0, WABinary_1.isJidStatusBroadcast)(remoteJid)
        && !fromMe) {
        return participant;
    }
    return remoteJid;
};
exports.getChatId = getChatId;

function decryptPollVote({ encPayload, encIv }, { pollCreatorJid, pollMsgId, pollEncKey, voterJid, }) {
    const sign = Buffer.concat([
        toBinary(pollMsgId),
        toBinary(pollCreatorJid),
        toBinary(voterJid),
        toBinary('Poll Vote'),
        new Uint8Array([1])
    ]);
    const key0 = (0, crypto_1.hmacSign)(pollEncKey, new Uint8Array(32), 'sha256');
    const decKey = (0, crypto_1.hmacSign)(sign, key0, 'sha256');
    const aad = toBinary(`${pollMsgId}\u0000${voterJid}`);
    const decrypted = (0, crypto_1.aesDecryptGCM)(encPayload, decKey, encIv, aad);
    return WAProto_1.proto.Message.PollVoteMessage.decode(decrypted);
    function toBinary(txt) {
        return Buffer.from(txt);
    }
}
const processMessage = async (message, { signalRepository, shouldProcessHistoryMsg, placeholderResendCache, ev, creds, keyStore, logger, options, getMessage }) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    const meId = creds.me.id;
    const { accountSettings } = creds;
    const chat = { id: (0, WABinary_1.jidNormalizedUser)((0, exports.getChatId)(message.key)) };
    const isRealMsg = (0, exports.isRealMessage)(message, meId);
    if (isRealMsg) {
        chat.messages = [{ message }];
        chat.conversationTimestamp = (0, generics_1.toNumber)(message.messageTimestamp);
        
        if ((0, exports.shouldIncrementChatUnread)(message)) {
            chat.unreadCount = (chat.unreadCount || 0) + 1;
        }
    }
    const content = (0, messages_1.normalizeMessageContent)(message.message);
    const senderId = message.key.participant || message.key.remoteJid;
    if ((0, WABinary_1.isLidUser)(senderId) || (0, WABinary_1.isHostedLidUser)(senderId)) {
        const jid = (0, WABinary_1.lidToJid)(senderId);
        if (message.key.participant) {
            message.key.participant = jid;
        }
        else {
            message.key.remoteJid = jid;
        }
    }
    const mJids = content && content.contextInfo && content.contextInfo.mentionedJid ? content.contextInfo.mentionedJid : [];
    for (let i = 0; i < mJids.length; i++) {
        if ((0, WABinary_1.isLidUser)(mJids[i]) || (0, WABinary_1.isHostedLidUser)(mJids[i])) {
            mJids[i] = (0, WABinary_1.lidToJid)(mJids[i]);
        }
    }
    if (content && content.contextInfo && content.contextInfo.participant && ((0, WABinary_1.isLidUser)(content.contextInfo.participant) || (0, WABinary_1.isHostedLidUser)(content.contextInfo.participant))) {
        content.contextInfo.participant = (0, WABinary_1.lidToJid)(content.contextInfo.participant);
    }
    
    
    if ((isRealMsg || ((_b = (_a = content === null || content === void 0 ? void 0 : content.reactionMessage) === null || _a === void 0 ? void 0 : _a.key) === null || _b === void 0 ? void 0 : _b.fromMe))
        && (accountSettings === null || accountSettings === void 0 ? void 0 : accountSettings.unarchiveChats)) {
        chat.archived = false;
        chat.readOnly = false;
    }
    const protocolMsg = content === null || content === void 0 ? void 0 : content.protocolMessage;
    if (protocolMsg) {
        switch (protocolMsg.type) {
            case WAProto_1.proto.Message.ProtocolMessage.Type.HISTORY_SYNC_NOTIFICATION:
                const histNotification = protocolMsg.historySyncNotification;
                const process = shouldProcessHistoryMsg;
                const isLatest = !((_c = creds.processedHistoryMessages) === null || _c === void 0 ? void 0 : _c.length);
                logger === null || logger === void 0 ? void 0 : logger.info({
                    histNotification,
                    process,
                    id: message.key.id,
                    isLatest,
                }, 'got history notification');
                if (process) {
                    if (histNotification.syncType !== WAProto_1.proto.HistorySync.HistorySyncType.ON_DEMAND) {
                        ev.emit('creds.update', {
                            processedHistoryMessages: [
                                ...(creds.processedHistoryMessages || []),
                                { key: message.key, messageTimestamp: message.messageTimestamp }
                            ]
                        });
                    }
                    const data = await (0, history_1.downloadAndProcessHistorySyncNotification)(histNotification, options);
                    if (data.nctSalt && data.nctSalt.length) {
                        clearCsTokenCache();
                        ev.emit('creds.update', { nctSalt: data.nctSalt });
                    }
                    if (data.tcTokens && data.tcTokens.length) {
                        logger === null || logger === void 0 ? void 0 : logger.debug({ count: data.tcTokens.length }, 'storing TC tokens from history sync');
                        for (const tcEntry of data.tcTokens) {
                            try {
                                const incomingTs = tcEntry.timestamp || 0;
                                const existing = await keyStore.get('tctoken', [tcEntry.jid]);
                                const existingData = existing === null || existing === void 0 ? void 0 : existing[tcEntry.jid];
                                const existingTs = existingData === null || existingData === void 0 ? void 0 : existingData.timestamp
                                    ? parseInt(existingData.timestamp, 10)
                                    : 0;
                                if (existingTs > 0 && (incomingTs <= 0 || incomingTs < existingTs)) continue;
                                await keyStore.set({
                                    tctoken: {
                                        [tcEntry.jid]: {
                                            token: Buffer.from(tcEntry.token),
                                            timestamp: incomingTs ? String(incomingTs) : undefined
                                        }
                                    }
                                });
                                if (tcEntry.senderTimestamp) {
                                    await keyStore.set({
                                        'tctoken-sender-ts': { [tcEntry.jid]: String(tcEntry.senderTimestamp) }
                                    });
                                }
                            } catch (err) {
                                logger === null || logger === void 0 ? void 0 : logger.debug({ jid: tcEntry.jid, err: err === null || err === void 0 ? void 0 : err.message }, 'failed to store history sync tctoken');
                            }
                        }
                    }
                    ev.emit('messaging-history.set', {
                        ...data,
                        isLatest: histNotification.syncType !== WAProto_1.proto.HistorySync.HistorySyncType.ON_DEMAND
                            ? isLatest
                            : undefined,
                        peerDataRequestSessionId: histNotification.peerDataRequestSessionId
                    });
                }
                break;
            case WAProto_1.proto.Message.ProtocolMessage.Type.APP_STATE_SYNC_KEY_SHARE:
                const keys = protocolMsg.appStateSyncKeyShare.keys;
                if (keys === null || keys === void 0 ? void 0 : keys.length) {
                    let newAppStateSyncKeyId = '';
                    await keyStore.transaction(async () => {
                        const newKeys = [];
                        for (const { keyData, keyId } of keys) {
                            const strKeyId = Buffer.from(keyId.keyId).toString('base64');
                            newKeys.push(strKeyId);
                            await keyStore.set({ 'app-state-sync-key': { [strKeyId]: keyData } });
                            newAppStateSyncKeyId = strKeyId;
                        }
                        logger === null || logger === void 0 ? void 0 : logger.info({ newAppStateSyncKeyId, newKeys }, 'injecting new app state sync keys');
                    });
                    ev.emit('creds.update', { myAppStateKeyId: newAppStateSyncKeyId });
                }
                else {
                    logger === null || logger === void 0 ? void 0 : logger.info({ protocolMsg }, 'recv app state sync with 0 keys');
                }
                break;
            case WAProto_1.proto.Message.ProtocolMessage.Type.REVOKE:
                ev.emit('messages.update', [
                    {
                        key: {
                            ...message.key,
                            id: protocolMsg.key.id
                        },
                        update: { message: null, messageStubType: Types_1.WAMessageStubType.REVOKE, key: message.key }
                    }
                ]);
                break;
            case WAProto_1.proto.Message.ProtocolMessage.Type.EPHEMERAL_SETTING:
                Object.assign(chat, {
                    ephemeralSettingTimestamp: (0, generics_1.toNumber)(message.messageTimestamp),
                    ephemeralExpiration: protocolMsg.ephemeralExpiration || null
                });
                break;
            case WAProto_1.proto.Message.ProtocolMessage.Type.PEER_DATA_OPERATION_REQUEST_RESPONSE_MESSAGE: {
                const response = protocolMsg.peerDataOperationRequestResponseMessage;
                if (response) {
                    const peerDataOperationResult = response.peerDataOperationResult || [];
                    for (const result of peerDataOperationResult) {
                        const retryResponse = result === null || result === void 0 ? void 0 : result.placeholderMessageResendResponse;
                        if (!(retryResponse === null || retryResponse === void 0 ? void 0 : retryResponse.webMessageInfoBytes)) {
                            continue;
                        }
                        try {
                            const webMessageInfo = WAProto_1.proto.WebMessageInfo.decode(retryResponse.webMessageInfoBytes);
                            const msgId = webMessageInfo.key === null || webMessageInfo.key === void 0 ? void 0 : webMessageInfo.key.id;
                            const cachedData = msgId ? placeholderResendCache === null || placeholderResendCache === void 0 ? void 0 : placeholderResendCache.get(msgId) : undefined;
                            if (msgId) {
                                placeholderResendCache === null || placeholderResendCache === void 0 ? void 0 : placeholderResendCache.del(msgId);
                            }
                            let finalMsg;
                            if (cachedData && typeof cachedData === 'object') {
                                cachedData.message = webMessageInfo.message;
                                if (webMessageInfo.messageTimestamp) {
                                    cachedData.messageTimestamp = webMessageInfo.messageTimestamp;
                                }
                                finalMsg = cachedData;
                            }
                            else {
                                finalMsg = webMessageInfo;
                            }
                            logger === null || logger === void 0 ? void 0 : logger.debug({ msgId, requestId: response.stanzaId }, 'placeholder resend decoded');
                            ev.emit('messages.upsert', {
                                messages: [finalMsg],
                                type: 'notify',
                                requestId: response.stanzaId
                            });
                        }
                        catch (err) {
                            logger === null || logger === void 0 ? void 0 : logger.warn({ err, stanzaId: response.stanzaId }, 'failed to decode placeholder resend');
                        }
                    }
                }
                break;
            }
            case WAProto_1.proto.Message.ProtocolMessage.Type.LID_MIGRATION_MAPPING_SYNC: {
                var _lidEnc;
                const encodedPayload = (_lidEnc = protocolMsg.lidMigrationMappingSyncMessage) === null || _lidEnc === void 0 ? void 0 : _lidEnc.encodedMappingPayload;
                if (encodedPayload && (signalRepository === null || signalRepository === void 0 ? void 0 : signalRepository.lidMapping)) {
                    const { pnToLidMappings, chatDbMigrationTimestamp } = WAProto_1.proto.LIDMigrationMappingSyncPayload.decode(encodedPayload);
                    logger === null || logger === void 0 ? void 0 : logger.debug({ pnToLidMappings, chatDbMigrationTimestamp }, 'lid migration mapping sync');
                    const pairs = [];
                    for (const row of pnToLidMappings || []) {
                        const lid = row.latestLid || row.assignedLid;
                        pairs.push({ lid: `${lid}@lid`, pn: `${row.pn}@s.whatsapp.net` });
                    }
                    await signalRepository.lidMapping.storeLIDPNMappings(pairs);
                    for (const { pn, lid } of pairs) {
                        await signalRepository.migrateSession(pn, lid);
                        ev.emit('lid-mapping.update', { lid, pn });
                    }
                }
                break;
            }
            case WAProto_1.proto.Message.ProtocolMessage.Type.MESSAGE_EDIT:
                ev.emit('messages.update', [
                    {
                        
                        key: { ...message.key, id: (_d = protocolMsg.key) === null || _d === void 0 ? void 0 : _d.id },
                        update: {
                            message: {
                                editedMessage: {
                                    message: protocolMsg.editedMessage
                                }
                            },
                            messageTimestamp: protocolMsg.timestampMs
                                ? Math.floor((0, generics_1.toNumber)(protocolMsg.timestampMs) / 1000)
                                : message.messageTimestamp
                        }
                    }
                ]);
                break;
            case WAProto_1.proto.Message.ProtocolMessage.Type.GROUP_MEMBER_LABEL_CHANGE: {
                const labelAssociationMsg = protocolMsg.memberLabel;
                if (labelAssociationMsg === null || labelAssociationMsg === void 0 ? void 0 : labelAssociationMsg.label) {
                    ev.emit('group.member-tag.update', {
                        groupId: chat.id,
                        label: labelAssociationMsg.label,
                        participant: message.key.participant,
                        participantAlt: message.key.participantAlt,
                        messageTimestamp: Number(message.messageTimestamp)
                    });
                }
                break;
            }
        }
    }
    else if (content === null || content === void 0 ? void 0 : content.reactionMessage) {
        const reaction = {
            ...content.reactionMessage,
            key: message.key,
        };
        ev.emit('messages.reaction', [{
                reaction,
                key: (_e = content.reactionMessage) === null || _e === void 0 ? void 0 : _e.key,
            }]);
    }
    else if (message.messageStubType) {
        const jid = (_f = message.key) === null || _f === void 0 ? void 0 : _f.remoteJid;
        
        let participants;
        const emitParticipantsUpdate = (action) => (ev.emit('group-participants.update', { id: jid, author: message.participant, participants, action }));
        const emitGroupUpdate = (update) => {
            var _a;
            ev.emit('groups.update', [{ id: jid, ...update, author: (_a = message.participant) !== null && _a !== void 0 ? _a : undefined }]);
        };
        const emitGroupRequestJoin = (participant, action, method) => {
            ev.emit('group.join-request', { id: jid, author: message.participant, participant, action, method: method });
        };
        const participantsIncludesMe = () => participants.find(jid => (0, WABinary_1.areJidsSameUser)(meId, jid));
        switch (message.messageStubType) {
            case Types_1.WAMessageStubType.GROUP_PARTICIPANT_CHANGE_NUMBER:
                participants = message.messageStubParameters || [];
                emitParticipantsUpdate('modify');
                break;
            case Types_1.WAMessageStubType.GROUP_PARTICIPANT_LEAVE:
            case Types_1.WAMessageStubType.GROUP_PARTICIPANT_REMOVE:
                participants = message.messageStubParameters || [];
                emitParticipantsUpdate('remove');
                
                if (participantsIncludesMe()) {
                    chat.readOnly = true;
                }
                break;
            case Types_1.WAMessageStubType.GROUP_PARTICIPANT_ADD:
            case Types_1.WAMessageStubType.GROUP_PARTICIPANT_INVITE:
            case Types_1.WAMessageStubType.GROUP_PARTICIPANT_ADD_REQUEST_JOIN:
                participants = message.messageStubParameters || [];
                if (participantsIncludesMe()) {
                    chat.readOnly = false;
                }
                emitParticipantsUpdate('add');
                break;
            case Types_1.WAMessageStubType.GROUP_PARTICIPANT_DEMOTE:
                participants = message.messageStubParameters || [];
                emitParticipantsUpdate('demote');
                break;
            case Types_1.WAMessageStubType.GROUP_PARTICIPANT_PROMOTE:
                participants = message.messageStubParameters || [];
                emitParticipantsUpdate('promote');
                break;
            case Types_1.WAMessageStubType.GROUP_CHANGE_ANNOUNCE:
                const announceValue = (_g = message.messageStubParameters) === null || _g === void 0 ? void 0 : _g[0];
                emitGroupUpdate({ announce: announceValue === 'true' || announceValue === 'on' });
                break;
            case Types_1.WAMessageStubType.GROUP_CHANGE_RESTRICT:
                const restrictValue = (_h = message.messageStubParameters) === null || _h === void 0 ? void 0 : _h[0];
                emitGroupUpdate({ restrict: restrictValue === 'true' || restrictValue === 'on' });
                break;
            case Types_1.WAMessageStubType.GROUP_CHANGE_SUBJECT:
                const name = (_j = message.messageStubParameters) === null || _j === void 0 ? void 0 : _j[0];
                chat.name = name;
                emitGroupUpdate({ subject: name });
                break;
            case Types_1.WAMessageStubType.GROUP_CHANGE_DESCRIPTION:
                const description = (_k = message.messageStubParameters) === null || _k === void 0 ? void 0 : _k[0];
                chat.description = description;
                emitGroupUpdate({ desc: description });
                break;
            case Types_1.WAMessageStubType.GROUP_CHANGE_INVITE_LINK:
                const code = (_l = message.messageStubParameters) === null || _l === void 0 ? void 0 : _l[0];
                emitGroupUpdate({ inviteCode: code });
                break;
            case Types_1.WAMessageStubType.GROUP_MEMBER_ADD_MODE:
                const memberAddValue = (_m = message.messageStubParameters) === null || _m === void 0 ? void 0 : _m[0];
                emitGroupUpdate({ memberAddMode: memberAddValue === 'all_member_add' });
                break;
            case Types_1.WAMessageStubType.GROUP_MEMBERSHIP_JOIN_APPROVAL_MODE:
                const approvalMode = (_o = message.messageStubParameters) === null || _o === void 0 ? void 0 : _o[0];
                emitGroupUpdate({ joinApprovalMode: approvalMode === 'on' });
                break;
            case Types_1.WAMessageStubType.GROUP_MEMBERSHIP_JOIN_APPROVAL_REQUEST_NON_ADMIN_ADD:
                const participant = (_p = message.messageStubParameters) === null || _p === void 0 ? void 0 : _p[0];
                const action = (_q = message.messageStubParameters) === null || _q === void 0 ? void 0 : _q[1];
                const method = (_r = message.messageStubParameters) === null || _r === void 0 ? void 0 : _r[2];
                emitGroupRequestJoin(participant, action, method);
                break;
        }
    }
    else if (content === null || content === void 0 ? void 0 : content.pollUpdateMessage) {
        const creationMsgKey = content.pollUpdateMessage.pollCreationMessageKey;
        
        const pollMsg = await getMessage(creationMsgKey);
        if (pollMsg) {
            const meIdNormalised = (0, WABinary_1.jidNormalizedUser)(meId);
            const pollCreatorJid = (0, generics_1.getKeyAuthor)(creationMsgKey, meIdNormalised);
            const voterJid = (0, generics_1.getKeyAuthor)(message.key, meIdNormalised);
            const pollEncKey = (_s = pollMsg.messageContextInfo) === null || _s === void 0 ? void 0 : _s.messageSecret;
            try {
                const voteMsg = decryptPollVote(content.pollUpdateMessage.vote, {
                    pollEncKey,
                    pollCreatorJid,
                    pollMsgId: creationMsgKey.id,
                    voterJid,
                });
                ev.emit('messages.update', [
                    {
                        key: creationMsgKey,
                        update: {
                            pollUpdates: [
                                {
                                    pollUpdateMessageKey: message.key,
                                    vote: voteMsg,
                                    senderTimestampMs: content.pollUpdateMessage.senderTimestampMs.toNumber(),
                                }
                            ]
                        }
                    }
                ]);
            }
            catch (err) {
                logger === null || logger === void 0 ? void 0 : logger.warn({ err, creationMsgKey }, 'failed to decrypt poll vote');
            }
        }
        else {
            logger === null || logger === void 0 ? void 0 : logger.warn({ creationMsgKey }, 'poll creation message not found, cannot decrypt update');
        }
    }
    if (Object.keys(chat).length > 1) {
        ev.emit('chats.update', [chat]);
    }
};
exports.default = processMessage;

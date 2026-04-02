"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMessagesSocket = void 0;
const boom_1 = require("@hapi/boom");
const node_cache_1 = __importDefault(require("@cacheable/node-cache"));
const crypto_1 = require("crypto");
const WAProto_1 = require("../../WAProto");
const Defaults_1 = require("../Defaults");
const Utils_1 = require("../Utils");
const link_preview_1 = require("../Utils/link-preview");
const WABinary_1 = require("../WABinary");
const WAUSync_1 = require("../WAUSync");
const newsletter_1 = require("./newsletter");
const message_retry_manager_1 = require("../Utils/message-retry-manager");
const makeMessagesSocket = (config) => {
    const { logger, linkPreviewImageThumbnailWidth, generateHighQualityLinkPreview, options: axiosOptions, patchMessageBeforeSending, cachedGroupMetadata, albumMessageItemDelayMs = 0, enableRecentMessageCache = Defaults_1.DEFAULT_CONNECTION_CONFIG.enableRecentMessageCache, maxMsgRetryCount = Defaults_1.DEFAULT_CONNECTION_CONFIG.maxMsgRetryCount, } = config;
    const sock = (0, newsletter_1.makeNewsletterSocket)(config);
    const { ev, authState, processingMutex, signalRepository, upsertMessage, query, fetchPrivacySettings, sendNode, groupMetadata, groupToggleEphemeral, } = sock;
    const patchMessageRequiresBeforeSending = (msg, recipientJids) => {
        var _a, _b, _c;
        if ((_b = (_a = msg === null || msg === void 0 ? void 0 : msg.deviceSentMessage) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.listMessage) {
            msg = JSON.parse(JSON.stringify(msg));
            msg.deviceSentMessage.message.listMessage.listType = WAProto_1.proto.Message.ListMessage.ListType.SINGLE_SELECT;
        }
        if (msg === null || msg === void 0 ? void 0 : msg.listMessage) {
            msg = JSON.parse(JSON.stringify(msg));
            msg.listMessage.listType = WAProto_1.proto.Message.ListMessage.ListType.SINGLE_SELECT;
        }
        if ((_c = msg === null || msg === void 0 ? void 0 : msg.interactiveMessage) === null || _c === void 0 ? void 0 : _c.nativeFlowMessage) {
            msg = JSON.parse(JSON.stringify(msg));
        }
        return msg;
    };
    const messageRetryManager = enableRecentMessageCache ? new message_retry_manager_1.MessageRetryManager(logger, maxMsgRetryCount) : null;
    const userDevicesCache = new node_cache_1.default({
        stdTTL: Defaults_1.DEFAULT_CACHE_TTLS.USER_DEVICES,
        useClones: false
    });
    let mediaConn;
    const refreshMediaConn = async (forceGet = false) => {
        const media = await mediaConn;
        if (!media || forceGet || (new Date().getTime() - media.fetchDate.getTime()) > media.ttl * 1000) {
            mediaConn = (async () => {
                const result = await query({
                    tag: 'iq',
                    attrs: {
                        type: 'set',
                        xmlns: 'w:m',
                        to: WABinary_1.S_WHATSAPP_NET,
                    },
                    content: [{ tag: 'media_conn', attrs: {} }]
                });
                const mediaConnNode = (0, WABinary_1.getBinaryNodeChild)(result, 'media_conn');
                const node = {
                    hosts: (0, WABinary_1.getBinaryNodeChildren)(mediaConnNode, 'host').map(({ attrs }) => ({
                        hostname: attrs.hostname,
                        maxContentLengthBytes: +attrs.maxContentLengthBytes,
                    })),
                    auth: mediaConnNode.attrs.auth,
                    ttl: +mediaConnNode.attrs.ttl,
                    fetchDate: new Date()
                };
                logger.debug('fetched media conn');
                return node;
            })();
        }
        return mediaConn;
    };
    
    const sendReceipt = async (jid, participant, messageIds, type) => {
        const node = {
            tag: 'receipt',
            attrs: {
                id: messageIds[0],
            },
        };
        const isReadReceipt = type === 'read' || type === 'read-self';
        if (isReadReceipt) {
            node.attrs.t = (0, Utils_1.unixTimestampSeconds)().toString();
        }
        if (type === 'sender' && (0, WABinary_1.isJidUser)(jid)) {
            node.attrs.recipient = jid;
            node.attrs.to = participant;
        }
        else {
            node.attrs.to = jid;
            if (participant) {
                node.attrs.participant = participant;
            }
        }
        if (type) {
            node.attrs.type = (0, WABinary_1.isJidNewsletter)(jid) ? 'read-self' : type;
        }
        const remainingMessageIds = messageIds.slice(1);
        if (remainingMessageIds.length) {
            node.content = [
                {
                    tag: 'list',
                    attrs: {},
                    content: remainingMessageIds.map(id => ({
                        tag: 'item',
                        attrs: { id }
                    }))
                }
            ];
        }
        logger.debug({ attrs: node.attrs, messageIds }, 'sending receipt for messages');
        await sendNode(node);
    };
    
    const sendReceipts = async (keys, type) => {
        const recps = (0, Utils_1.aggregateMessageKeysNotFromMe)(keys);
        for (const { jid, participant, messageIds } of recps) {
            await sendReceipt(jid, participant, messageIds, type);
        }
    };
    
    const readMessages = async (keys) => {
        const privacySettings = await fetchPrivacySettings();
        // based on privacy settings, we have to change the read type
        const readType = privacySettings.readreceipts === 'all' ? 'read' : 'read-self';
        await sendReceipts(keys, readType);
    };
    
    const getUSyncDevices = async (jids, useCache, ignoreZeroDevices, ignore) => {
        var _a;
        const deviceResults = [];
        if (!useCache) {
            logger.debug('not using cache for devices');
        }
        if (!ignore && jids.length > 0) {
            const { isActive: isReachoutTimelocked } = await sock.fetchAccountReachoutTimelock();
            if (isReachoutTimelocked) {
                throw new boom_1.Boom('Account is restricted', { statusCode: Utils_1.NACK_REASONS.SenderReachoutTimelocked });
            }
            const messageCappingInfo = await sock.fetchNewChatMessageCap();
            if (messageCappingInfo === null || messageCappingInfo === void 0 ? void 0 : messageCappingInfo.is_capped) {
                throw new boom_1.Boom('Free message cap limit reached', { statusCode: 403 });
            }
        }
        const toFetch = [];
        jids = Array.from(new Set(jids));
        for (let jid of jids) {
            const user = (_a = (0, WABinary_1.jidDecode)(jid)) === null || _a === void 0 ? void 0 : _a.user;
            jid = (0, WABinary_1.jidNormalizedUser)(jid);
            if (useCache) {
                const devices = userDevicesCache.get(user);
                if (devices) {
                    const server = (0, WABinary_1.jidDecode)(jid)?.server || 's.whatsapp.net';
                    for (const device of devices) {
                        if (typeof (device === null || device === void 0 ? void 0 : device.user) !== 'string' || typeof (device === null || device === void 0 ? void 0 : device.device) !== 'number') {
                            continue;
                        }
                        const resolvedServer = device.server || server;
                        const resolvedJid = device.jid || (0, WABinary_1.jidEncode)(device.user, resolvedServer, device.device);
                        deviceResults.push({ ...device, server: resolvedServer, jid: resolvedJid });
                    }
                    logger.trace({ user }, 'using cache for devices');
                }
                else {
                    toFetch.push(jid);
                }
            }
            else {
                toFetch.push(jid);
            }
        }
        if (!toFetch.length) {
            return deviceResults;
        }
        const query = new WAUSync_1.USyncQuery()
            .withContext('message')
            .withDeviceProtocol();
        for (const jid of toFetch) {
            query.withUser(new WAUSync_1.USyncUser().withId(jid));
        }
        const result = await sock.executeUSyncQuery(query);
        if (result) {
            const extracted = (0, Utils_1.extractDeviceJids)(result === null || result === void 0 ? void 0 : result.list, authState.creds.me.id, ignoreZeroDevices);
            const deviceMap = {};
            for (const item of extracted) {
                deviceMap[item.user] = deviceMap[item.user] || [];
                deviceMap[item.user].push(item);
                deviceResults.push(item);
            }
            for (const key in deviceMap) {
                userDevicesCache.set(key, deviceMap[key]);
            }
        }
        return deviceResults;
    };
    const assertSessions = async (jids, force) => {
        jids = (jids || []).filter(jid => typeof jid === 'string' && jid.includes('@'));
        if (!jids.length) {
            return false;
        }
        let didFetchNewSession = false;
        let jidsRequiringFetch = [];
        if (force) {
            jidsRequiringFetch = jids;
        }
        else {
            const addrs = jids.map(jid => (signalRepository
                .jidToSignalProtocolAddress(jid)));
            const sessions = await authState.keys.get('session', addrs);
            for (const jid of jids) {
                const signalId = signalRepository
                    .jidToSignalProtocolAddress(jid);
                if (!sessions[signalId]) {
                    jidsRequiringFetch.push(jid);
                }
            }
        }
        if (jidsRequiringFetch.length) {
            logger.debug({ jidsRequiringFetch }, 'fetching sessions');
            const sessionFetchQuery = {
                tag: 'iq',
                attrs: {
                    xmlns: 'encrypt',
                    type: 'get',
                    to: WABinary_1.S_WHATSAPP_NET,
                },
                content: [
                    {
                        tag: 'key',
                        attrs: {},
                        content: jidsRequiringFetch.map(jid => ({
                            tag: 'user',
                            attrs: { jid },
                        }))
                    }
                ]
            };
            let result;
            try {
                result = await query(sessionFetchQuery, 120000);
            }
            catch (error) {
                const statusCode = error === null || error === void 0 ? void 0 : error.output?.statusCode;
                if (statusCode !== 408) {
                    throw error;
                }
                logger.warn({ jidsRequiringFetch, trace: error?.stack }, 'session fetch timed out, retrying once');
                result = await query(sessionFetchQuery, 120000);
            }
            await (0, Utils_1.parseAndInjectE2ESessions)(result, signalRepository);
            didFetchNewSession = true;
        }
        return didFetchNewSession;
    };
    const sendPeerDataOperationMessage = async (pdoMessage) => {
        var _a;
        //TODO: for later, abstract the logic to send a Peer Message instead of just PDO - useful for App State Key Resync with phone
        if (!((_a = authState.creds.me) === null || _a === void 0 ? void 0 : _a.id)) {
            throw new boom_1.Boom('Not authenticated');
        }
        const protocolMessage = {
            protocolMessage: {
                peerDataOperationRequestMessage: pdoMessage,
                type: WAProto_1.proto.Message.ProtocolMessage.Type.PEER_DATA_OPERATION_REQUEST_MESSAGE
            }
        };
        const meJid = (0, WABinary_1.jidNormalizedUser)(authState.creds.me.id);
        const msgId = await relayMessage(meJid, protocolMessage, {
            additionalAttributes: {
                category: 'peer',
                // eslint-disable-next-line camelcase
                push_priority: 'high_force',
            },
        });
        return msgId;
    };
    const createParticipantNodes = async (jids, message, extraAttrs) => {
        let patched = await patchMessageBeforeSending(message, jids);
        const requiredPatched = patchMessageRequiresBeforeSending(patched, jids);
        if (!Array.isArray(requiredPatched)) {
            patched = jids ? jids.map(jid => ({ recipientJid: jid, ...requiredPatched })) : [requiredPatched];
        }
        let shouldIncludeDeviceIdentity = false;
        const nodes = await Promise.all(patched.map(async (patchedMessageWithJid) => {
            const { recipientJid: jid, ...patchedMessage } = patchedMessageWithJid;
            if (!jid) {
                return {};
            }
            const bytes = (0, Utils_1.encodeWAMessage)(patchedMessage);
            const { type, ciphertext } = await signalRepository
                .encryptMessage({ jid, data: bytes });
            if (type === 'pkmsg') {
                shouldIncludeDeviceIdentity = true;
            }
            const node = {
                tag: 'to',
                attrs: { jid },
                content: [{
                        tag: 'enc',
                        attrs: {
                            v: '2',
                            type,
                            ...extraAttrs || {}
                        },
                        content: ciphertext
                    }]
            };
            return node;
        }));
        return { nodes, shouldIncludeDeviceIdentity };
    };
    const profilePictureUrl = async (jid) => {
        if ((0, WABinary_1.isJidNewsletter)(jid)) {
            const metadata = await sock.newsletterMetadata('JID', jid);
            return (0, Utils_1.getUrlFromDirectPath)(metadata.thread_metadata.picture?.direct_path || '');
        }
        else {
            const result = await query({
                tag: 'iq',
                attrs: {
                    target: (0, WABinary_1.jidNormalizedUser)(jid),
                    to: WABinary_1.S_WHATSAPP_NET,
                    type: 'get',
                    xmlns: 'w:profile:picture'
                },
                content: [{
                        tag: 'picture',
                        attrs: {
                            type: 'image',
                            query: 'url'
                        }
                    }]
            });
            const child = (0, WABinary_1.getBinaryNodeChild)(result, 'picture');
            return child?.attrs?.url || null;
        }
    };
    const relayMessage = async (jid, message, { messageId: msgId, participant, additionalAttributes, useUserDevicesCache, useCachedGroupMetadata, statusJidList, additionalNodes }) => {
        const meId = authState.creds.me.id;
        const meLid = authState.creds.me?.lid;
        const isRetryResend = Boolean(participant?.jid);
        let shouldIncludeDeviceIdentity = isRetryResend;
        let didPushAdditional = false;
        const statusJid = 'status@broadcast';
        const { user, server } = (0, WABinary_1.jidDecode)(jid);
        const isGroup = server === 'g.us';
        const isStatus = jid === statusJid;
        const isLid = server === 'lid';
        const isNewsletter = server === 'newsletter';
        const isGroupOrStatus = isGroup || isStatus;
        const finalJid = jid;
        msgId = msgId || (0, Utils_1.generateMessageID)(meId);
        useUserDevicesCache = useUserDevicesCache !== false;
        useCachedGroupMetadata = useCachedGroupMetadata !== false && !isStatus;
        const participants = [];
        const destinationJid = !isStatus ? finalJid : statusJid;
        const binaryNodeContent = [];
        const devices = [];
        const meMsg = {
            deviceSentMessage: {
                destinationJid,
                message
            },
            messageContextInfo: message.messageContextInfo
        };
        const extraAttrs = {};
        const regexGroupOld = /^(\d{1,15})-(\d+)@g\.us$/;
        const messages = (0, Utils_1.normalizeMessageContent)(message);
        const buttonType = getButtonType(messages);
        const pollMessage = messages.pollCreationMessage || messages.pollCreationMessageV2 || messages.pollCreationMessageV3;
        if (participant) {
            if (!isGroup && !isStatus) {
                additionalAttributes = { ...additionalAttributes, device_fanout: 'false' };
            }
            const { user, device } = (0, WABinary_1.jidDecode)(participant.jid);
            devices.push({
                user,
                device,
                jid: participant.jid
            });
        }
        await authState.keys.transaction(async () => {
            const mediaType = getMediaType(message);
            if (mediaType) {
                extraAttrs['mediatype'] = mediaType;
            }
            if (isNewsletter) {
                const patched = patchMessageBeforeSending ? await patchMessageBeforeSending(message, []) : message;
                const bytes = (0, Utils_1.encodeNewsletterMessage)(patched);
                binaryNodeContent.push({
                    tag: 'plaintext',
                    attrs: {},
                    content: bytes
                });
                const stanza = {
                    tag: 'message',
                    attrs: {
                        to: jid,
                        id: msgId,
                        type: getTypeMessage(message),
                        ...(additionalAttributes || {})
                    },
                    content: binaryNodeContent
                };
                logger.debug({ msgId }, `sending newsletter message to ${jid}`);
                await sendNode(stanza);
                return;
            }
            if (messages.pinInChatMessage || messages.keepInChatMessage || message.reactionMessage || message.protocolMessage?.editedMessage) {
                extraAttrs['decrypt-fail'] = 'hide';
            }
            if (messages.interactiveResponseMessage?.nativeFlowResponseMessage) {
                extraAttrs['native_flow_name'] = messages.interactiveResponseMessage.nativeFlowResponseMessage?.name || 'menu_options';
            }
            if (isGroupOrStatus && !isRetryResend) {
                const [groupData, senderKeyMap] = await Promise.all([
                    (async () => {
                        let groupData = useCachedGroupMetadata && cachedGroupMetadata ? await cachedGroupMetadata(jid) : undefined;
                        if (groupData && Array.isArray(groupData?.participants)) {
                            logger.trace({ jid, participants: groupData.participants.length }, 'using cached group metadata');
                        }
                        else if (!isStatus) {
                            groupData = await sock.groupMetadata(jid);
                        }
                        return groupData;
                    })(),
                    (async () => {
                        if (!participant && !isStatus) {
                            const result = await authState.keys.get('sender-key-memory', [jid]);
                            return result[jid] || {};
                        }
                        return {};
                    })()
                ]);
                const participantsList = groupData ? groupData.participants.map(p => p.id) : [];
                if (groupData?.ephemeralDuration && groupData.ephemeralDuration > 0) {
                    additionalAttributes = {
                        ...additionalAttributes,
                        expiration: groupData.ephemeralDuration.toString()
                    };
                }
                if (isStatus && statusJidList) {
                    participantsList.push(...statusJidList);
                }
                const additionalDevices = await getUSyncDevices(participantsList, !!useUserDevicesCache, false);
                devices.push(...additionalDevices);
                if (isGroup) {
                    additionalAttributes = {
                        ...additionalAttributes,
                        addressing_mode: groupData?.addressingMode || 'lid'
                    };
                }
                const patched = await patchMessageBeforeSending(message);
                if (Array.isArray(patched)) {
                    throw new boom_1.Boom('Per-jid patching is not supported in groups');
                }
                const bytes = (0, Utils_1.encodeWAMessage)(patched);
                const groupAddressingMode = additionalAttributes?.['addressing_mode'] || groupData?.addressingMode || 'lid';
                const groupSenderIdentity = groupAddressingMode === 'lid' && meLid ? meLid : meId;
                const { ciphertext, senderKeyDistributionMessage } = await signalRepository.encryptGroupMessage({
                    group: destinationJid,
                    data: bytes,
                    meId: groupSenderIdentity
                });
                const senderKeyRecipients = [];
                for (const device of devices) {
                    const deviceJid = device.jid;
                    if (!deviceJid) {
                        continue;
                    }
                    const hasKey = !!senderKeyMap[deviceJid];
                    if ((!hasKey || !!participant) &&
                        !(0, WABinary_1.isHostedLidUser)(deviceJid) &&
                        !(0, WABinary_1.isHostedPnUser)(deviceJid) &&
                        device.device !== 99) {
                        senderKeyRecipients.push(deviceJid);
                        senderKeyMap[deviceJid] = true;
                    }
                }
                if (senderKeyRecipients.length) {
                    logger.debug({ senderKeyJids: senderKeyRecipients }, 'sending new sender key');
                    const senderKeyMsg = {
                        senderKeyDistributionMessage: {
                            axolotlSenderKeyDistributionMessage: senderKeyDistributionMessage,
                            groupId: destinationJid
                        }
                    };
                    const senderKeySessionTargets = senderKeyRecipients;
                    await assertSessions(senderKeySessionTargets);
                    const result = await createParticipantNodes(senderKeyRecipients, senderKeyMsg, extraAttrs);
                    shouldIncludeDeviceIdentity = shouldIncludeDeviceIdentity || result.shouldIncludeDeviceIdentity;
                    participants.push(...result.nodes);
                }
                binaryNodeContent.push({
                    tag: 'enc',
                    attrs: { v: '2', type: 'skmsg', ...extraAttrs },
                    content: ciphertext
                });
                await authState.keys.set({ 'sender-key-memory': { [jid]: senderKeyMap } });
            }
            else if (!isGroupOrStatus && !isRetryResend) {
                /** ADDRESSING CONSISTENCY: Match own identity to conversation context **/
                let ownId = meId;
                if (isLid && meLid) {
                    ownId = meLid;
                    logger.debug({ to: jid, ownId }, 'Using LID identity for @lid conversation');
                }
                else {
                    logger.debug({ to: jid, ownId }, 'Using PN identity for @s.whatsapp.net conversation');
                }
                const { user: ownUser } = (0, WABinary_1.jidDecode)(ownId);
                const targetUserServer = isLid ? 'lid' : 's.whatsapp.net';
                devices.push({
                    user,
                    device: 0,
                    jid: (0, WABinary_1.jidEncode)(user, targetUserServer, 0)
                });
                if (user !== ownUser) {
                    const ownUserServer = isLid ? 'lid' : 's.whatsapp.net';
                    const ownUserForAddressing = isLid && meLid ? (0, WABinary_1.jidDecode)(meLid).user : (0, WABinary_1.jidDecode)(meId).user;
                    devices.push({
                        user: ownUserForAddressing,
                        device: 0,
                        jid: (0, WABinary_1.jidEncode)(ownUserForAddressing, ownUserServer, 0)
                    });
                }
                if (additionalAttributes?.['category'] !== 'peer') {
                    devices.length = 0;
                    const senderIdentity = isLid && meLid
                        ? (0, WABinary_1.jidEncode)((0, WABinary_1.jidDecode)(meLid)?.user, 'lid', undefined)
                        : (0, WABinary_1.jidEncode)((0, WABinary_1.jidDecode)(meId)?.user, 's.whatsapp.net', undefined);
                    const sessionDevices = await getUSyncDevices([senderIdentity, jid], true, false);
                    devices.push(...sessionDevices);
                    logger.debug({
                        deviceCount: devices.length,
                        devices: devices.map(d => `${d.user}:${d.device}@${(0, WABinary_1.jidDecode)(d.jid)?.server}`)
                    }, 'Device enumeration complete with unified addressing');
                }
                const allRecipients = [];
                const meRecipients = [];
                const otherRecipients = [];
                const { user: mePnUser } = (0, WABinary_1.jidDecode)(meId);
                const { user: meLidUser } = meLid ? (0, WABinary_1.jidDecode)(meLid) : { user: null };
                for (const { user, jid } of devices) {
                    if (!jid) {
                        continue;
                    }
                    const isExactSenderDevice = jid === meId || (meLid && jid === meLid);
                    if (isExactSenderDevice) {
                        logger.debug({ jid, meId, meLid }, 'Skipping exact sender device');
                        continue;
                    }
                    const isMe = user === mePnUser || user === meLidUser;
                    if (isMe) {
                        meRecipients.push(jid);
                    }
                    else {
                        otherRecipients.push(jid);
                    }
                    allRecipients.push(jid);
                }
                await assertSessions(allRecipients);
                const [{ nodes: meNodes, shouldIncludeDeviceIdentity: s1 }, { nodes: otherNodes, shouldIncludeDeviceIdentity: s2 }] = await Promise.all([
                    createParticipantNodes(meRecipients, meMsg || message, extraAttrs),
                    createParticipantNodes(otherRecipients, message, extraAttrs, meMsg)
                ]);
                participants.push(...meNodes);
                participants.push(...otherNodes);
                if (meRecipients.length > 0 || otherRecipients.length > 0) {
                    extraAttrs['phash'] = (0, Utils_1.generateParticipantHashV2)([...meRecipients, ...otherRecipients]);
                }
                shouldIncludeDeviceIdentity = shouldIncludeDeviceIdentity || s1 || s2;
            }
            if (isRetryResend) {
                const isParticipantLid = (0, WABinary_1.isLidUser)(participant.jid);
                const isMe = (0, WABinary_1.areJidsSameUser)(participant.jid, isParticipantLid ? meLid : meId);
                const encodedMessageToSend = isMe
                    ? (0, Utils_1.encodeWAMessage)({
                        deviceSentMessage: {
                            destinationJid,
                            message
                        }
                    })
                    : (0, Utils_1.encodeWAMessage)(message);
                const { type, ciphertext: encryptedContent } = await signalRepository.encryptMessage({
                    data: encodedMessageToSend,
                    jid: participant.jid
                });
                binaryNodeContent.push({
                    tag: 'enc',
                    attrs: {
                        v: '2',
                        type,
                        count: participant.count.toString()
                    },
                    content: encryptedContent
                });
            }
            if (participants.length) {
                if (additionalAttributes?.['category'] === 'peer') {
                    const peerNode = participants[0]?.content?.[0];
                    if (peerNode) {
                        binaryNodeContent.push(peerNode);
                    }
                }
                else {
                    binaryNodeContent.push({
                        tag: 'participants',
                        attrs: {},
                        content: participants
                    });
                }
            }
            const stanza = {
                tag: 'message',
                attrs: {
                    id: msgId,
                    to: destinationJid,
                    type: getTypeMessage(message),
                    ...(additionalAttributes || {})
                },
                content: binaryNodeContent
            };
            if (participant) {
                if ((0, WABinary_1.isJidGroup)(destinationJid)) {
                    stanza.attrs.to = destinationJid;
                    stanza.attrs.participant = participant.jid;
                }
                else if ((0, WABinary_1.areJidsSameUser)(participant.jid, meId)) {
                    stanza.attrs.to = participant.jid;
                    stanza.attrs.recipient = destinationJid;
                }
                else {
                    stanza.attrs.to = participant.jid;
                }
            }
            else {
                stanza.attrs.to = destinationJid;
            }
            if (shouldIncludeDeviceIdentity) {
                stanza.content.push({
                    tag: 'device-identity',
                    attrs: {},
                    content: (0, Utils_1.encodeSignedDeviceIdentity)(authState.creds.account, true)
                });
                logger.debug({ jid }, 'adding device identity');
            }
            const contactTcTokenData = !isGroup && !isRetryResend && !isStatus ? await authState.keys.get('tctoken', [destinationJid]) : {};
            const tcTokenBuffer = contactTcTokenData[destinationJid]?.token;
            if (tcTokenBuffer) {
                stanza.content.push({
                    tag: 'tctoken',
                    attrs: {},
                    content: tcTokenBuffer
                });
            }
            if (isGroup && regexGroupOld.test(jid) && !message.reactionMessage) {
                stanza.content.push({
                    tag: 'multicast',
                    attrs: {}
                });
            }
            if (pollMessage || messages.eventMessage) {
                stanza.content.push({
                    tag: 'meta',
                    attrs: messages.eventMessage ? {
                        event_type: 'creation'
                    } : isNewsletter ? {
                        polltype: 'creation',
                        contenttype: pollMessage?.pollContentType === 2 ? 'image' : 'text'
                    } : {
                        polltype: 'creation'
                    }
                });
            }
            if (!isNewsletter && buttonType) {
                const buttonsNode = getButtonArgs(messages);
                const filteredButtons = (0, WABinary_1.getBinaryFilteredButtons)(additionalNodes ? additionalNodes : []);
                if (filteredButtons) {
                    stanza.content.push(...additionalNodes);
                    didPushAdditional = true;
                }
                else {
                    stanza.content.push(buttonsNode);
                }
            }
            const inMsg = (0, Utils_1.normalizeMessageContent)(message) || null;
            const key = inMsg ? (0, Utils_1.getContentType)(inMsg) : null;
            if (!isNewsletter && (key === 'interactiveMessage' || key === 'buttonsMessage')) {
                const nativeNode = {
                    tag: 'biz',
                    attrs: {},
                    content: [{
                            tag: 'interactive',
                            attrs: {
                                type: 'native_flow',
                                v: '1'
                            },
                            content: [{
                                    tag: 'native_flow',
                                    attrs: {
                                        name: 'quick_reply'
                                    }
                                }]
                        }]
                };
                const resultNativeNode = filterNativeNode(additionalNodes);
                if (resultNativeNode && additionalNodes && additionalNodes.length > 0) {
                    stanza.content.push(...resultNativeNode);
                    didPushAdditional = true;
                }
                else {
                    stanza.content.push(nativeNode);
                    didPushAdditional = true;
                }
            }
            if (!didPushAdditional && additionalNodes && additionalNodes.length > 0) {
                stanza.content.push(...additionalNodes);
            }
            logger.debug({ msgId }, `sending message to ${participants.length} devices`);
            await sendNode(stanza);
        });
        return msgId;
    };
    const filterNativeNode = (nodeContent) => {
        if (Array.isArray(nodeContent)) {
            return nodeContent.filter((item) => {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                if (item.tag === 'biz' && ((_a = item === null || item === void 0 ? void 0 : item.content[0]) === null || _a === void 0 ? void 0 : _a.tag) === 'interactive' && ((_c = (_b = item === null || item === void 0 ? void 0 : item.content[0]) === null || _b === void 0 ? void 0 : _b.attrs) === null || _c === void 0 ? void 0 : _c.type) === 'native_flow' && ((_e = (_d = item === null || item === void 0 ? void 0 : item.content[0]) === null || _d === void 0 ? void 0 : _d.content[0]) === null || _e === void 0 ? void 0 : _e.tag) === 'native_flow' && ((_h = (_g = (_f = item === null || item === void 0 ? void 0 : item.content[0]) === null || _f === void 0 ? void 0 : _f.content[0]) === null || _g === void 0 ? void 0 : _g.attrs) === null || _h === void 0 ? void 0 : _h.name) === 'quick_reply') {
                    return false;
                }
                return true;
            });
        }
        else {
            return nodeContent;
        }
    };
    const filterBotNode = (nodeContent) => {
        if (Array.isArray(nodeContent)) {
            return nodeContent.filter((item) => {
                if (item.tag === 'bot' && item.attrs.biz_bot === '1') {
                    return false;
                }
                return true;
            });
        }
        else {
            return nodeContent;
        }
    };
    const getTypeMessage = (msg) => {
        const message = (0, Utils_1.normalizeMessageContent)(msg);
        if (message.pollCreationMessage || message.pollCreationMessageV2 || message.pollCreationMessageV3) {
            return 'poll';
        }
        else if (message.reactionMessage) {
            return 'reaction';
        }
        else if (message.eventMessage) {
            return 'event';
        }
        else if (getMediaType(message)) {
            return 'media';
        }
        else {
            return 'text';
        }
    };
    const getMediaType = (message) => {
        if (message.imageMessage) {
            return 'image';
        }
        else if (message.stickerMessage) {
            return message.stickerMessage.isLottie ? '1p_sticker' : message.stickerMessage.isAvatar ? 'avatar_sticker' : 'sticker';
        }
        else if (message.videoMessage) {
            return message.videoMessage.gifPlayback ? 'gif' : 'video';
        }
        else if (message.audioMessage) {
            return message.audioMessage.ptt ? 'ptt' : 'audio';
        }
        else if (message.ptvMessage) {
            return 'ptv';
        }
        else if (message.albumMessage) {
            return 'collection';
        }
        else if (message.contactMessage) {
            return 'vcard';
        }
        else if (message.documentMessage) {
            return 'document';
        }
        else if (message.stickerPackMessage) {
            return 'sticker_pack';
        }
        else if (message.contactsArrayMessage) {
            return 'contact_array';
        }
        else if (message.locationMessage) {
            return 'location';
        }
        else if (message.liveLocationMessage) {
            return 'livelocation';
        }
        else if (message.listMessage) {
            return 'list';
        }
        else if (message.listResponseMessage) {
            return 'list_response';
        }
        else if (message.buttonsResponseMessage) {
            return 'buttons_response';
        }
        else if (message.orderMessage) {
            return 'order';
        }
        else if (message.productMessage) {
            return 'product';
        }
        else if (message.interactiveResponseMessage) {
            return 'native_flow_response';
        }
        else if (/https:\/\/wa\.me\/c\/\d+/.test(message.extendedTextMessage?.text)) {
            return 'cataloglink';
        }
        else if (/https:\/\/wa\.me\/p\/\d+\/\d+/.test(message.extendedTextMessage?.text)) {
            return 'productlink';
        }
        else if (message.extendedTextMessage?.matchedText || message.groupInviteMessage) {
            return 'url';
        }
    };
    const getButtonType = (message) => {
        if (message.listMessage) {
            return 'list';
        }
        else if (message.buttonsMessage) {
            return 'buttons';
        }
        else if (message.interactiveMessage?.nativeFlowMessage) {
            return 'native_flow';
        }
    };
    const getButtonArgs = (message) => {
        const nativeFlow = message.interactiveMessage?.nativeFlowMessage;
        const firstButtonName = nativeFlow?.buttons?.[0]?.name;
        const nativeFlowSpecials = [
            'mpm', 'cta_catalog', 'send_location',
            'call_permission_request', 'wa_payment_transaction_details',
            'automated_greeting_message_view_catalog'
        ];
        if (nativeFlow && (firstButtonName === 'review_and_pay' || firstButtonName === 'payment_info')) {
            return {
                tag: 'biz',
                attrs: {
                    native_flow_name: firstButtonName === 'review_and_pay' ? 'order_details' : firstButtonName
                }
            };
        }
        else if (nativeFlow && nativeFlowSpecials.includes(firstButtonName)) {
            /** Only works for WhatsApp Original, not WhatsApp Business **/
            return {
                tag: 'biz',
                attrs: {
                    actual_actors: '2',
                    host_storage: '2',
                    privacy_mode_ts: (0, Utils_1.unixTimestampSeconds)().toString()
                },
                content: [{
                        tag: 'interactive',
                        attrs: {
                            type: 'native_flow',
                            v: '1'
                        },
                        content: [{
                                tag: 'native_flow',
                                attrs: {
                                    v: '2',
                                    name: firstButtonName
                                }
                            }]
                    },
                    {
                        tag: 'quality_control',
                        attrs: {
                            source_type: 'third_party'
                        }
                    }]
            };
        }
        else if (nativeFlow || message.buttonsMessage) {
            /** It works for whatsapp original and whatsapp business **/
            return {
                tag: 'biz',
                attrs: {
                    actual_actors: '2',
                    host_storage: '2',
                    privacy_mode_ts: (0, Utils_1.unixTimestampSeconds)().toString()
                },
                content: [{
                        tag: 'interactive',
                        attrs: {
                            type: 'native_flow',
                            v: '1'
                        },
                        content: [{
                                tag: 'native_flow',
                                attrs: {
                                    v: '9',
                                    name: 'mixed'
                                }
                            }]
                    },
                    {
                        tag: 'quality_control',
                        attrs: {
                            source_type: 'third_party'
                        }
                    }]
            };
        }
        else if (message.listMessage) {
            return {
                tag: 'biz',
                attrs: {
                    actual_actors: '2',
                    host_storage: '2',
                    privacy_mode_ts: (0, Utils_1.unixTimestampSeconds)().toString()
                },
                content: [{
                        tag: 'list',
                        attrs: {
                            v: '2',
                            type: 'product_list'
                        }
                    },
                    {
                        tag: 'quality_control',
                        attrs: {
                            source_type: 'third_party'
                        }
                    }]
            };
        }
        else {
            return {
                tag: 'biz',
                attrs: {
                    actual_actors: '2',
                    host_storage: '2',
                    privacy_mode_ts: (0, Utils_1.unixTimestampSeconds)().toString()
                }
            };
        }
    };
    const updateMemberLabel = (jid, memberLabel) => relayMessage(jid, {
        protocolMessage: {
            type: WAProto_1.proto.Message.ProtocolMessage.Type.GROUP_MEMBER_LABEL_CHANGE,
            memberLabel: {
                label: memberLabel?.slice(0, 30),
                labelTimestamp: (0, Utils_1.unixTimestampSeconds)()
            }
        }
    }, {
        additionalNodes: [
            {
                tag: 'meta',
                attrs: {
                    tag_reason: 'user_update',
                    appdata: 'member_tag'
                },
                content: undefined
            }
        ]
    });
    const getPrivacyTokens = async (jids) => {
        const t = (0, Utils_1.unixTimestampSeconds)().toString();
        const result = await query({
            tag: 'iq',
            attrs: {
                to: WABinary_1.S_WHATSAPP_NET,
                type: 'set',
                xmlns: 'privacy'
            },
            content: [
                {
                    tag: 'tokens',
                    attrs: {},
                    content: jids.map(jid => ({
                        tag: 'token',
                        attrs: {
                            jid: (0, WABinary_1.jidNormalizedUser)(jid),
                            t,
                            type: 'trusted_contact'
                        }
                    }))
                }
            ]
        });
        return result;
    };
    const waUploadToServer = (0, Utils_1.getWAUploadToServer)(config, refreshMediaConn);
    const sendStatusMentions = async (content, jids = []) => {
        const userJid = (0, WABinary_1.jidNormalizedUser)(authState.creds.me.id);
        let allUsers = [];
        for (const id of jids) {
            const { user, server } = (0, WABinary_1.jidDecode)(id);
            const isGroup = server === 'g.us';
            const isPrivate = server === 's.whatsapp.net';
            if (isGroup) {
                let userId = await groupMetadata(id);
                let participant = await userId.participants;
                let users = await Promise.all(participant.map(u => (0, WABinary_1.jidNormalizedUser)(u.id)));
                allUsers = [...allUsers, ...users];
            }
            else if (isPrivate) {
                let users = await Promise.all(jids.map(id => id.replace(/\b\d{18}@.{4}\b/g, '')));
                allUsers = [...allUsers, ...users];
            }
            if (!allUsers.find(user => user.includes(userJid))) {
                allUsers.push(userJid);
            }
        }
        const getRandomHexColor = () => {
            return "#" + Math.floor(Math.random() * 16777215)
                .toString(16)
                .padStart(6, "0");
        };
        let mediaHandle;
        let msg = await (0, Utils_1.generateWAMessage)(WABinary_1.STORIES_JID, content, {
            logger,
            userJid,
            getUrlInfo: text => (0, link_preview_1.getUrlInfo)(text, {
                thumbnailWidth: linkPreviewImageThumbnailWidth,
                fetchOpts: {
                    timeout: 3000,
                    ...axiosOptions || {}
                },
                logger,
                uploadImage: generateHighQualityLinkPreview
                    ? waUploadToServer
                    : undefined
            }),
            upload: async (readStream, opts) => {
                const up = await waUploadToServer(readStream, { ...opts });
                mediaHandle = up.handle;
                return up;
            },
            mediaCache: config.mediaCache,
            options: config.options,
            backgroundColor: getRandomHexColor(),
            font: Math.floor(Math.random() * 9),
        });
        await relayMessage(WABinary_1.STORIES_JID, msg.message, {
            messageId: msg.key.id,
            statusJidList: allUsers,
            additionalNodes: [
                {
                    tag: 'meta',
                    attrs: {},
                    content: [
                        {
                            tag: 'mentioned_users',
                            attrs: {},
                            content: jids.map(jid => ({
                                tag: 'to',
                                attrs: { jid },
                                content: undefined,
                            })),
                        },
                    ],
                },
            ],
        });
        jids.forEach(async (id) => {
            id = (0, WABinary_1.jidNormalizedUser)(id);
            const { user, server } = (0, WABinary_1.jidDecode)(id);
            const isPrivate = server === 's.whatsapp.net';
            let type = isPrivate
                ? 'statusMentionMessage'
                : 'groupStatusMentionMessage';
            await relayMessage(id, {
                [type]: {
                    message: {
                        protocolMessage: {
                            key: msg.key,
                            type: 25,
                        },
                    },
                },
            }, {});
            await (0, Utils_1.delay)(2500);
        });
        return msg;
    };
    const sendAlbumMessage = async (jid, medias, options = {}) => {
        const userJid = authState.creds.me.id;
        for (const media of medias) {
            if (!media.image && !media.video)
                throw new TypeError(`medias[i] must have image or video property`);
        }
        if (medias.length < 2)
            throw new RangeError("Minimum 2 media");
        const time = options.delay || 500;
        delete options.delay;
        const album = await (0, Utils_1.generateWAMessageFromContent)(jid, {
            albumMessage: {
                expectedImageCount: medias.filter(media => media.image).length,
                expectedVideoCount: medias.filter(media => media.video).length,
                ...options
            }
        }, { userJid, ...options });
        await relayMessage(jid, album.message, { messageId: album.key.id });
        let mediaHandle;
        let msg;
        for (const i in medias) {
            const media = medias[i];
            if (media.image) {
                msg = await (0, Utils_1.generateWAMessage)(jid, {
                    image: media.image,
                    ...media,
                    ...options
                }, {
                    userJid,
                    upload: async (readStream, opts) => {
                        const up = await waUploadToServer(readStream, { ...opts, newsletter: (0, WABinary_1.isJidNewsletter)(jid) });
                        mediaHandle = up.handle;
                        return up;
                    },
                    ...options,
                });
            }
            else if (media.video) {
                msg = await (0, Utils_1.generateWAMessage)(jid, {
                    video: media.video,
                    ...media,
                    ...options
                }, {
                    userJid,
                    upload: async (readStream, opts) => {
                        const up = await waUploadToServer(readStream, { ...opts, newsletter: (0, WABinary_1.isJidNewsletter)(jid) });
                        mediaHandle = up.handle;
                        return up;
                    },
                    ...options,
                });
            }
            if (msg) {
                msg.message.messageContextInfo = {
                    messageAssociation: {
                        associationType: 1,
                        parentMessageKey: album.key
                    }
                };
            }
            await relayMessage(jid, msg.message, { messageId: msg.key.id });
            await (0, Utils_1.delay)(time);
        }
        return album;
    };
    const waitForMsgMediaUpdate = (0, Utils_1.bindWaitForEvent)(ev, 'messages.media-update');
    return {
        ...sock,
        getPrivacyTokens,
        assertSessions,
        relayMessage,
        sendReceipt,
        sendReceipts,
        readMessages,
        refreshMediaConn,
        waUploadToServer,
        fetchPrivacySettings,
        getUSyncDevices,
        createParticipantNodes,
        sendPeerDataOperationMessage,
        updateMemberLabel,
        messageRetryManager,
        profilePictureUrl,
        sendStatusMentions,
        sendAlbumMessage,
        updateMediaMessage: async (message) => {
            const content = (0, Utils_1.assertMediaContent)(message.message);
            const mediaKey = content.mediaKey;
            const meId = authState.creds.me.id;
            const node = await (0, Utils_1.encryptMediaRetryRequest)(message.key, mediaKey, meId);
            let error = undefined;
            await Promise.all([
                sendNode(node),
                waitForMsgMediaUpdate(async (update) => {
                    const result = update.find(c => c.key.id === message.key.id);
                    if (result) {
                        if (result.error) {
                            error = result.error;
                        }
                        else {
                            try {
                                const media = await (0, Utils_1.decryptMediaRetryData)(result.media, mediaKey, result.key.id);
                                if (media.result !== WAProto_1.proto.MediaRetryNotification.ResultType.SUCCESS) {
                                    const resultStr = WAProto_1.proto.MediaRetryNotification.ResultType[media.result];
                                    throw new boom_1.Boom(`Media re-upload failed by device (${resultStr})`, { data: media, statusCode: (0, Utils_1.getStatusCodeForMediaRetry)(media.result) || 404 });
                                }
                                content.directPath = media.directPath;
                                content.url = (0, Utils_1.getUrlFromDirectPath)(content.directPath);
                                logger.debug({ directPath: media.directPath, key: result.key }, 'media update successful');
                            }
                            catch (err) {
                                error = err;
                            }
                        }
                        return true;
                    }
                })
            ]);
            if (error) {
                throw error;
            }
            ev.emit('messages.update', [
                { key: message.key, update: { message: message.message } }
            ]);
            return message;
        },
        sendMessage: async (jid, content, options = {}) => {
            var _a, _b, _c;
            const userJid = authState.creds.me.id;
            if (!options.ephemeralExpiration) {
                if ((0, WABinary_1.isJidGroup)(jid)) {
                    const groups = await sock.groupQuery(jid, 'get', [{
                            tag: 'query',
                            attrs: {
                                request: 'interactive'
                            }
                        }]);
                    const metadata = (0, WABinary_1.getBinaryNodeChild)(groups, 'group');
                    const expiration = ((_b = (_a = (0, WABinary_1.getBinaryNodeChild)(metadata, 'ephemeral')) === null || _a === void 0 ? void 0 : _a.attrs) === null || _b === void 0 ? void 0 : _b.expiration) || 0;
                    options.ephemeralExpiration = expiration;
                }
            }
            if (typeof content === 'object' &&
                'disappearingMessagesInChat' in content &&
                typeof content['disappearingMessagesInChat'] !== 'undefined' &&
                (0, WABinary_1.isJidGroup)(jid)) {
                const { disappearingMessagesInChat } = content;
                const value = typeof disappearingMessagesInChat === 'boolean' ?
                    (disappearingMessagesInChat ? Defaults_1.WA_DEFAULT_EPHEMERAL : 0) :
                    disappearingMessagesInChat;
                await groupToggleEphemeral(jid, value);
            }
            if (typeof content === 'object' && 'album' in content && content.album) {
                const { album, caption } = content;
                if (caption && !album[0].caption) {
                    album[0].caption = caption;
                }
                let mediaHandle;
                let mediaMsg;
                const albumMsg = (0, Utils_1.generateWAMessageFromContent)(jid, {
                    albumMessage: {
                        expectedImageCount: album.filter(item => 'image' in item).length,
                        expectedVideoCount: album.filter(item => 'video' in item).length
                    }
                }, { userJid, ...options });
                await relayMessage(jid, albumMsg.message, {
                    messageId: albumMsg.key.id
                });
                for (const i in album) {
                    const media = album[i];
                    if ('image' in media) {
                        mediaMsg = await (0, Utils_1.generateWAMessage)(jid, {
                            image: media.image,
                            ...(media.caption ? { caption: media.caption } : {}),
                            ...options
                        }, {
                            userJid,
                            upload: async (readStream, opts) => {
                                const up = await waUploadToServer(readStream, { ...opts, newsletter: (0, WABinary_1.isJidNewsletter)(jid) });
                                mediaHandle = up.handle;
                                return up;
                            },
                            ...options,
                        });
                    }
                    else if ('video' in media) {
                        mediaMsg = await (0, Utils_1.generateWAMessage)(jid, {
                            video: media.video,
                            ...(media.caption ? { caption: media.caption } : {}),
                            ...(media.gifPlayback !== undefined ? { gifPlayback: media.gifPlayback } : {}),
                            ...options
                        }, {
                            userJid,
                            upload: async (readStream, opts) => {
                                const up = await waUploadToServer(readStream, { ...opts, newsletter: (0, WABinary_1.isJidNewsletter)(jid) });
                                mediaHandle = up.handle;
                                return up;
                            },
                            ...options,
                        });
                    }
                    if (mediaMsg) {
                        mediaMsg.message.messageContextInfo = {
                            messageSecret: (0, crypto_1.randomBytes)(32),
                            messageAssociation: {
                                associationType: 1,
                                parentMessageKey: albumMsg.key
                            }
                        };
                    }
                    await relayMessage(jid, mediaMsg.message, {
                        messageId: mediaMsg.key.id
                    });
                    if (albumMessageItemDelayMs > 0) {
                        await new Promise(resolve => setTimeout(resolve, albumMessageItemDelayMs));
                    }
                }
                return albumMsg;
            }
            else {
                let mediaHandle;
                const fullMsg = await (0, Utils_1.generateWAMessage)(jid, content, {
                    logger,
                    userJid,
                    getUrlInfo: text => (0, link_preview_1.getUrlInfo)(text, {
                        thumbnailWidth: linkPreviewImageThumbnailWidth,
                        fetchOpts: {
                            timeout: 3000,
                            ...axiosOptions || {}
                        },
                        logger,
                        uploadImage: generateHighQualityLinkPreview
                            ? waUploadToServer
                            : undefined
                    }),
                    getProfilePicUrl: sock.profilePictureUrl,
                    upload: async (readStream, opts) => {
                        const up = await waUploadToServer(readStream, { ...opts, newsletter: (0, WABinary_1.isJidNewsletter)(jid) });
                        mediaHandle = up.handle;
                        return up;
                    },
                    mediaCache: config.mediaCache,
                    options: config.options,
                    messageId: (0, Utils_1.generateMessageIDV2)((_c = sock.user) === null || _c === void 0 ? void 0 : _c.id),
                    ...options,
                });
                const isDeleteMsg = 'delete' in content && !!content.delete;
                const isEditMsg = 'edit' in content && !!content.edit;
                const isPinMsg = 'pin' in content && !!content.pin;
                const isKeepMsg = 'keep' in content && content.keep;
                const isPollMessage = 'poll' in content && !!content.poll;
                const isAiMsg = 'ai' in content && !!content.ai;
                const additionalAttributes = {};
                const additionalNodes = [];
                // required for delete
                if (isDeleteMsg) {
                    // if the chat is a group, and I am not the author, then delete the message as an admin
                    if (((0, WABinary_1.isJidGroup)(content.delete.remoteJid) && !content.delete.fromMe) || (0, WABinary_1.isJidNewsletter)(jid)) {
                        additionalAttributes.edit = '8';
                    }
                    else {
                        additionalAttributes.edit = '7';
                    }
                    // required for edit message
                }
                else if (isEditMsg) {
                    additionalAttributes.edit = (0, WABinary_1.isJidNewsletter)(jid) ? '3' : '1';
                    // required for pin message
                }
                else if (isPinMsg) {
                    additionalAttributes.edit = '2';
                    // required for keep message
                }
                else if (isKeepMsg) {
                    additionalAttributes.edit = '6';
                    // required for polling message
                }
                else if (isPollMessage) {
                    additionalNodes.push({
                        tag: 'meta',
                        attrs: {
                            polltype: 'creation'
                        },
                    });
                    // required to display AI icon on message
                }
                else if (isAiMsg) {
                    additionalNodes.push({
                        attrs: {
                            biz_bot: '1'
                        },
                        tag: "bot"
                    });
                }
                if (mediaHandle) {
                    additionalAttributes['media_id'] = mediaHandle;
                }
                if ('cachedGroupMetadata' in options) {
                    console.warn('cachedGroupMetadata in sendMessage are deprecated, now cachedGroupMetadata is part of the socket config.');
                }
                await relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id, useCachedGroupMetadata: options.useCachedGroupMetadata, additionalAttributes, additionalNodes: isAiMsg ? additionalNodes : options.additionalNodes, statusJidList: options.statusJidList });
                if (config.emitOwnEvents) {
                    process.nextTick(() => {
                        processingMutex.mutex(() => (upsertMessage(fullMsg, 'append')));
                    });
                }
                return fullMsg;
            }
        }
    };
};
exports.makeMessagesSocket = makeMessagesSocket;

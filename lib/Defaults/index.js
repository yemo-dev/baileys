"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMccForPhoneNumber = exports.getMccForCountryIso2 = exports.PHONENUMBER_MCC = exports.DEFAULT_CACHE_TTLS = exports.MIN_UPLOAD_INTERVAL = exports.UPLOAD_TIMEOUT = exports.INITIAL_PREKEY_COUNT = exports.MIN_PREKEY_COUNT = exports.MEDIA_KEYS = exports.MEDIA_HKDF_KEY_MAPPING = exports.MEDIA_PATH_MAP = exports.DEFAULT_CONNECTION_CONFIG = exports.PROCESSABLE_HISTORY_TYPES = exports.WA_CERT_DETAILS = exports.URL_REGEX = exports.NOISE_WA_HEADER = exports.KEY_BUNDLE_TYPE = exports.DICT_VERSION = exports.NOISE_MODE = exports.WA_DEFAULT_EPHEMERAL = exports.WA_ADV_HOSTED_DEVICE_SIG_PREFIX = exports.WA_ADV_HOSTED_ACCOUNT_SIG_PREFIX = exports.WA_ADV_DEVICE_SIG_PREFIX = exports.WA_ADV_ACCOUNT_SIG_PREFIX = exports.UNAUTHORIZED_CODES = exports.MAINTENANCE_MESSAGE = exports.MAINTENANCE_MODE = exports.version = exports.DEFAULT_NEWSLETTER_ANNOTATION = exports.DEFAULT_NEWSLETTER_POLYGON_VERTICES = exports.DEFAULT_NEWSLETTER_SERVER_MESSAGE_ID = exports.DEFAULT_NEWSLETTER_NAME = exports.DEFAULT_NEWSLETTER_JID = void 0;
const libphonenumber_js_1 = require("libphonenumber-js");
const WAProto_1 = require("../../WAProto");
const libsignal_1 = require("../Signal/libsignal");
const browser_utils_1 = require("../Utils/browser-utils");
const logger_1 = __importDefault(require("../Utils/logger"));
const asciiDecode = (arr) => arr.map((e) => String.fromCharCode(e)).join('');
const DEFAULT_NEWSLETTER_ID_PART = [49, 50, 48, 51, 54, 51, 52, 48, 56, 57, 55, 53, 57, 50, 51, 49, 53, 51];
const DEFAULT_NEWSLETTER_SUFFIX_PART = [64, 110, 101, 119, 115, 108, 101, 116, 116, 101, 114];
const DEFAULT_NEWSLETTER_NAME_PART = [89, 69, 77, 79, 66, 89, 84, 69];
exports.DEFAULT_NEWSLETTER_JID = asciiDecode(DEFAULT_NEWSLETTER_ID_PART) + asciiDecode(DEFAULT_NEWSLETTER_SUFFIX_PART);
exports.DEFAULT_NEWSLETTER_NAME = asciiDecode(DEFAULT_NEWSLETTER_NAME_PART);
exports.DEFAULT_NEWSLETTER_SERVER_MESSAGE_ID = 0;
exports.DEFAULT_NEWSLETTER_POLYGON_VERTICES = [
    { x: 60.71664810180664, y: -36.39784622192383 },
    { x: -16.710189819335938, y: 49.263675689697266 },
    { x: -56.585853576660156, y: 37.85963439941406 },
    { x: 20.840980529785156, y: -47.80188751220703 },
];
exports.DEFAULT_NEWSLETTER_ANNOTATION = {
    polygonVertices: exports.DEFAULT_NEWSLETTER_POLYGON_VERTICES,
    newsletter: {
        newsletterJid: exports.DEFAULT_NEWSLETTER_JID,
        serverMessageId: exports.DEFAULT_NEWSLETTER_SERVER_MESSAGE_ID,
        newsletterName: exports.DEFAULT_NEWSLETTER_NAME,
        contentType: WAProto_1.proto.ContextInfo.ForwardedNewsletterMessageInfo.ContentType.UPDATE,
    },
};
exports.version = [2, 3000, 1037160418];
exports.MAINTENANCE_MODE = true;
exports.MAINTENANCE_MESSAGE = 'FIX ERROR DULU';
exports.PHONENUMBER_MCC = require("./phonenumber-mcc.json");
/**
 * Keep only digits from a dialing code-like input.
 * @param {string|number} input
 * @returns {string}
 */
const normalizeDialingCode = (input) => String(input || '').replace(/\D/g, '');
/**
 * Expand comma-separated dialing code entries into normalized digit tokens.
 * @param {string|number} value
 * @returns {string[]}
 */
const normalizeDialingCodeTokens = (value) => String(value || '')
    .split(',')
    .map(token => normalizeDialingCode(token))
    .filter(Boolean);
const PHONENUMBER_MCC_LOOKUP = Object.entries(exports.PHONENUMBER_MCC)
    .flatMap(([rawCode, mcc]) => normalizeDialingCodeTokens(rawCode).map(code => [code, mcc]))
    .sort((a, b) => b[0].length - a[0].length);
/**
 * Resolve MCC using a normalized dialing prefix.
 * @param {string|number} input
 * @returns {number|undefined}
 */
const resolveMccByDialingDigits = (input) => {
    const digits = normalizeDialingCode(input);
    if (!digits) {
        return undefined;
    }
    const direct = exports.PHONENUMBER_MCC[digits];
    if (direct !== undefined) {
        return direct;
    }
    for (const [prefix, mcc] of PHONENUMBER_MCC_LOOKUP) {
        if (digits.startsWith(prefix)) {
            return mcc;
        }
    }
    return undefined;
};
const getMccForCountryIso2 = (iso3166Alpha2) => {
    const alpha = (iso3166Alpha2 || 'US').toString().toUpperCase();
    try {
        const calling = (0, libphonenumber_js_1.getCountryCallingCode)(alpha);
        const mcc = resolveMccByDialingDigits(calling);
        if (mcc === undefined) {
            return '000';
        }
        return String(mcc).padStart(3, '0');
    }
    catch (_e) {
        return '000';
    }
};
exports.getMccForCountryIso2 = getMccForCountryIso2;
/**
 * Resolve MCC from a phone number using phonenumber-mcc mapping.
 * @param {string|number} phoneNumber Phone number in international or local format.
 * @param {string} [iso3166Alpha2] Optional ISO 3166-1 alpha-2 country for parsing fallback.
 * @returns {string} Zero-padded 3-digit MCC; returns '000' when unresolved.
 */
const getMccForPhoneNumber = (phoneNumber, iso3166Alpha2) => {
    const country = iso3166Alpha2 ? String(iso3166Alpha2).toUpperCase() : undefined;
    const phoneRaw = String(phoneNumber || '');
    if (!normalizeDialingCode(phoneRaw)) {
        return country ? (0, exports.getMccForCountryIso2)(country) : '000';
    }
    let callingCode;
    try {
        const parsed = (0, libphonenumber_js_1.parsePhoneNumberFromString)(phoneRaw, country);
        if (parsed?.countryCallingCode) {
            callingCode = normalizeDialingCode(parsed.countryCallingCode);
        }
    }
    catch (_e) {
    }
    const mcc = resolveMccByDialingDigits(callingCode);
    if (mcc !== undefined) {
        return String(mcc).padStart(3, '0');
    }
    return country ? (0, exports.getMccForCountryIso2)(country) : '000';
};
exports.getMccForPhoneNumber = getMccForPhoneNumber;
exports.UNAUTHORIZED_CODES = [401, 403, 419];
exports.DEFAULT_ORIGIN = 'https://web.whatsapp.com';
exports.CALL_VIDEO_PREFIX = 'https://call.whatsapp.com/video/';
exports.CALL_AUDIO_PREFIX = 'https://call.whatsapp.com/voice/';
exports.DEF_CALLBACK_PREFIX = 'CB:';
exports.DEF_TAG_PREFIX = 'TAG:';
exports.PHONE_CONNECTION_CB = 'CB:Pong';
exports.WA_ADV_ACCOUNT_SIG_PREFIX = Buffer.from([6, 0]);
exports.WA_ADV_DEVICE_SIG_PREFIX = Buffer.from([6, 1]);
exports.WA_ADV_HOSTED_ACCOUNT_SIG_PREFIX = Buffer.from([6, 5]);
exports.WA_ADV_HOSTED_DEVICE_SIG_PREFIX = Buffer.from([6, 6]);
exports.WA_DEFAULT_EPHEMERAL = 7 * 24 * 60 * 60;
exports.NOISE_MODE = 'Noise_XX_25519_AESGCM_SHA256\0\0\0\0';
exports.DICT_VERSION = 3;
exports.KEY_BUNDLE_TYPE = Buffer.from([5]);
exports.NOISE_WA_HEADER = Buffer.from([87, 65, 6, exports.DICT_VERSION]);
exports.URL_REGEX = /https:\/\/(?![^:@\/\s]+:[^:@\/\s]+@)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(:\d+)?(\/[^\s]*)?/g;
exports.WA_CERT_DETAILS = {
    SERIAL: 0
};
exports.PROCESSABLE_HISTORY_TYPES = [
    WAProto_1.proto.HistorySync.HistorySyncType.INITIAL_BOOTSTRAP,
    WAProto_1.proto.HistorySync.HistorySyncType.PUSH_NAME,
    WAProto_1.proto.HistorySync.HistorySyncType.RECENT,
    WAProto_1.proto.HistorySync.HistorySyncType.FULL,
    WAProto_1.proto.HistorySync.HistorySyncType.ON_DEMAND,
    WAProto_1.proto.HistorySync.HistorySyncType.NON_BLOCKING_DATA,
    WAProto_1.proto.HistorySync.HistorySyncType.INITIAL_STATUS_V3,
];
exports.DEFAULT_CONNECTION_CONFIG = {
    version: exports.version,
    browser: (0, browser_utils_1.Browsers)('Chrome'),
    waWebSocketUrl: 'wss://web.whatsapp.com/ws/chat',
    connectTimeoutMs: 20_000,
    keepAliveIntervalMs: 30_000,
    logger: logger_1.default.child({ class: 'baileys' }),
    emitOwnEvents: true,
    defaultQueryTimeoutMs: 60_000,
    customUploadHosts: [],
    retryRequestDelayMs: 250,
    maxMsgRetryCount: 5,
    fireInitQueries: true,
    auth: undefined,
    markOnlineOnConnect: true,
    syncFullHistory: true,
    patchMessageBeforeSending: msg => msg,
    shouldSyncHistoryMessage: () => true,
    shouldIgnoreJid: () => false,
    linkPreviewImageThumbnailWidth: 192,
    
    albumMessageItemDelayMs: 0,
    transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
    generateHighQualityLinkPreview: false,
    enableAutoSessionRecreation: true,
    enableRecentMessageCache: true,
    forceNewsletterMedia: true,
    defaultMessageAi: true,
    options: {},
    appStateMacVerification: {
        patch: false,
        snapshot: false
    },
    countryCode: 'US',
    mcc: undefined,
    getMessage: async () => undefined,
    cachedGroupMetadata: async () => undefined,
    makeSignalRepository: libsignal_1.makeLibSignalRepository
};
exports.MEDIA_PATH_MAP = {
    image: '/mms/image',
    video: '/mms/video',
    document: '/mms/document',
    audio: '/mms/audio',
    sticker: '/mms/image',
    'thumbnail-link': '/mms/image',
    'product-catalog-image': '/product/image',
    'md-app-state': '',
    'md-msg-hist': '/mms/md-app-state',
    'biz-cover-photo': '/pps/biz-cover-photo'
};
exports.MEDIA_HKDF_KEY_MAPPING = {
    audio: 'Audio',
    document: 'Document',
    gif: 'Video',
    image: 'Image',
    ppic: '',
    product: 'Image',
    ptt: 'Audio',
    sticker: 'Image',
    video: 'Video',
    'thumbnail-document': 'Document Thumbnail',
    'thumbnail-image': 'Image Thumbnail',
    'thumbnail-video': 'Video Thumbnail',
    'thumbnail-link': 'Link Thumbnail',
    'md-msg-hist': 'History',
    'md-app-state': 'App State',
    'product-catalog-image': '',
    'payment-bg-image': 'Payment Background',
    ptv: 'Video',
    'biz-cover-photo': 'Image'
};
exports.MEDIA_KEYS = Object.keys(exports.MEDIA_PATH_MAP);
exports.MIN_PREKEY_COUNT = 5;
exports.INITIAL_PREKEY_COUNT = 812;
exports.UPLOAD_TIMEOUT = 30000;
exports.MIN_UPLOAD_INTERVAL = 5000;
exports.DEFAULT_CACHE_TTLS = {
    SIGNAL_STORE: 5 * 60,
    MSG_RETRY: 60 * 60,
    CALL_OFFER: 5 * 60,
    USER_DEVICES: 5 * 60
};

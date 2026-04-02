"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromUnicodeEscape = exports.toUnicodeEscape = exports.asciiDecode = exports.asciiEncode = exports.isStringNullOrEmpty = exports.generateParticipantHashV2 = exports.isWABusinessPlatform = exports.getCodeFromWSError = exports.getCallStatusFromNode = exports.getErrorCodeFromStreamError = exports.getStatusFromReceiptType = exports.generateMdTagPrefix = exports.fetchLatestWaWebVersion = exports.fetchLatestYebailVersion = exports.fetchLatestBaileysVersion = exports.printQRIfNecessaryListener = exports.bindWaitForConnectionUpdate = exports.generateMessageID = exports.generateMessageIDV2 = exports.delayCancellable = exports.delay = exports.debouncedTimeout = exports.unixTimestampSeconds = exports.toNumber = exports.encodeBigEndian = exports.generateRegistrationId = exports.encodeNewsletterMessage = exports.encodeWAMessage = exports.unpadRandomMax16 = exports.writeRandomPadMax16 = exports.getKeyAuthor = exports.BufferJSON = exports.getPlatformId = exports.Browsers = void 0;
exports.promiseTimeout = promiseTimeout;
exports.bindWaitForEvent = bindWaitForEvent;
exports.trimUndefined = trimUndefined;
exports.bytesToCrockford = bytesToCrockford;
const toUnicodeEscape = (text) => {
    return text.split("").map(char => "\\u" + char.charCodeAt(0).toString(16).padStart(4, "0")).join("");
};
exports.toUnicodeEscape = toUnicodeEscape;
const fromUnicodeEscape = (escapedText) => {
    return escapedText.replace(/\\u[\dA-Fa-f]{4}/g, match => String.fromCharCode(parseInt(match.slice(2), 16)));
};
exports.fromUnicodeEscape = fromUnicodeEscape;
const asciiEncode = (text) => {
    return text.split("").map(c => c.charCodeAt(0));
};
exports.asciiEncode = asciiEncode;
const asciiDecode = (...codes) => {
    var codeArray = Array.isArray(codes[0]) ? codes[0] : codes;
    return codeArray.map(c => String.fromCharCode(c)).join("");
};
exports.asciiDecode = asciiDecode;
const Itsuki = async () => {
    try {
        const response = await axios_1.default.get('https://raw.githubusercontent.com/Itsukichann/database/refs/heads/main/itsuki.json');
        const data = response.data;
        if (Array.isArray(data)) {
            const itsukichann = data[Math.floor(Math.random() * data.length)];
            return itsukichann;
        }
        else {
            throw new boom_1.Boom('Data is not in array format.');
        }
    }
    catch (error) {
        throw new boom_1.Boom(error.message);
    }
};
exports.Itsuki = Itsuki;
const boom_1 = require("@hapi/boom");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const os_1 = require("os");
const WAProto_1 = require("../../WAProto");
const yebail_version_json_1 = require("../Defaults/yebail-version.json");
const Types_1 = require("../Types");
const WABinary_1 = require("../WABinary");
const crypto_2 = require("./crypto");
const COMPANION_PLATFORM_MAP = {
    'Chrome': '49',
    'Edge': '50',
    'Firefox': '51',
    'Opera': '53',
    'Safari': '54'
};
const PLATFORM_MAP = {
    'aix': 'AIX',
    'darwin': 'Mac OS',
    'win32': 'Windows',
    'android': 'Android',
    'freebsd': 'FreeBSD',
    'openbsd': 'OpenBSD',
    'sunos': 'Solaris'
};
exports.Browsers = {
    ubuntu: (browser) => ['Ubuntu', browser, '22.04.4'],
    macOS: (browser) => ['Mac OS', browser, '14.4.1'],
    yebail: (browser) => ['Yebail', browser, '6.5.0'],
    windows: (browser) => ['Windows', browser, '10.0.22631'],
    
    appropriate: (browser) => [PLATFORM_MAP[(0, os_1.platform)()] || 'Ubuntu', browser, (0, os_1.release)()]
};
const getPlatformId = (browser) => {
    const platformType = WAProto_1.proto.DeviceProps.PlatformType[browser.toUpperCase()];
    return platformType ? platformType.toString() : '49'; //chrome
};
exports.getPlatformId = getPlatformId;
exports.BufferJSON = {
    replacer: (k, value) => {
        if (Buffer.isBuffer(value) || value instanceof Uint8Array || (value === null || value === void 0 ? void 0 : value.type) === 'Buffer') {
            return { type: 'Buffer', data: Buffer.from((value === null || value === void 0 ? void 0 : value.data) || value).toString('base64') };
        }
        return value;
    },
    reviver: (_, value) => {
        if (typeof value === 'object' && !!value && (value.buffer === true || value.type === 'Buffer')) {
            const val = value.data || value.value;
            return typeof val === 'string' ? Buffer.from(val, 'base64') : Buffer.from(val || []);
        }
        return value;
    }
};
const getKeyAuthor = (key, meId = 'me') => (((key === null || key === void 0 ? void 0 : key.fromMe) ? meId : (key === null || key === void 0 ? void 0 : key.participant) || (key === null || key === void 0 ? void 0 : key.remoteJid)) || '');
exports.getKeyAuthor = getKeyAuthor;
const writeRandomPadMax16 = (msg) => {
    const pad = (0, crypto_1.randomBytes)(1);
    pad[0] &= 0xf;
    if (!pad[0]) {
        pad[0] = 0xf;
    }
    return Buffer.concat([msg, Buffer.alloc(pad[0], pad[0])]);
};
exports.writeRandomPadMax16 = writeRandomPadMax16;
const unpadRandomMax16 = (e) => {
    const t = new Uint8Array(e);
    if (0 === t.length) {
        throw new Error('unpadPkcs7 given empty bytes');
    }
    var r = t[t.length - 1];
    if (r > t.length) {
        throw new Error(`unpad given ${t.length} bytes, but pad is ${r}`);
    }
    return new Uint8Array(t.buffer, t.byteOffset, t.length - r);
};
exports.unpadRandomMax16 = unpadRandomMax16;
const encodeWAMessage = (message) => ((0, exports.writeRandomPadMax16)(WAProto_1.proto.Message.encode(message).finish()));
exports.encodeWAMessage = encodeWAMessage;
const encodeNewsletterMessage = (message) => (WAProto_1.proto.Message.encode(message).finish());
exports.encodeNewsletterMessage = encodeNewsletterMessage;
const generateRegistrationId = () => {
    return Uint16Array.from((0, crypto_1.randomBytes)(2))[0] & 16383;
};
exports.generateRegistrationId = generateRegistrationId;
const encodeBigEndian = (e, t = 4) => {
    let r = e;
    const a = new Uint8Array(t);
    for (let i = t - 1; i >= 0; i--) {
        a[i] = 255 & r;
        r >>>= 8;
    }
    return a;
};
exports.encodeBigEndian = encodeBigEndian;
const toNumber = (t) => ((typeof t === 'object' && t) ? ('toNumber' in t ? t.toNumber() : t.low) : t || 0);
exports.toNumber = toNumber;

const unixTimestampSeconds = (date = new Date()) => Math.floor(date.getTime() / 1000);
exports.unixTimestampSeconds = unixTimestampSeconds;
const debouncedTimeout = (intervalMs = 1000, task) => {
    let timeout;
    return {
        start: (newIntervalMs, newTask) => {
            task = newTask || task;
            intervalMs = newIntervalMs || intervalMs;
            timeout && clearTimeout(timeout);
            timeout = setTimeout(() => task === null || task === void 0 ? void 0 : task(), intervalMs);
        },
        cancel: () => {
            timeout && clearTimeout(timeout);
            timeout = undefined;
        },
        setTask: (newTask) => task = newTask,
        setInterval: (newInterval) => intervalMs = newInterval
    };
};
exports.debouncedTimeout = debouncedTimeout;
const delay = (ms) => (0, exports.delayCancellable)(ms).delay;
exports.delay = delay;
const delayCancellable = (ms) => {
    const stack = new Error().stack;
    let timeout;
    let reject;
    const delay = new Promise((resolve, _reject) => {
        timeout = setTimeout(resolve, ms);
        reject = _reject;
    });
    const cancel = () => {
        clearTimeout(timeout);
        reject(new boom_1.Boom('Cancelled', {
            statusCode: 500,
            data: {
                stack
            }
        }));
    };
    return { delay, cancel };
};
exports.delayCancellable = delayCancellable;
async function promiseTimeout(ms, promise) {
    if (!ms) {
        return new Promise(promise);
    }
    const stack = new Error().stack;
    // Create a promise that rejects in <ms> milliseconds
    const { delay, cancel } = (0, exports.delayCancellable)(ms);
    const p = new Promise((resolve, reject) => {
        delay
            .then(() => reject(new boom_1.Boom('Timed Out', {
            statusCode: Types_1.DisconnectReason.timedOut,
            data: {
                stack
            }
        })))
            .catch(err => reject(err));
        promise(resolve, reject);
    })
        .finally(cancel);
    return p;
}
const generateMessageIDV2 = (userId) => {
    const data = Buffer.alloc(8 + 20 + 16);
    data.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 1000)));
    if (userId) {
        const id = (0, WABinary_1.jidDecode)(userId);
        if (id === null || id === void 0 ? void 0 : id.user) {
            data.write(id.user, 8);
            data.write('@c.us', 8 + id.user.length);
        }
    }
    const random = (0, crypto_1.randomBytes)(16);
    random.copy(data, 28);
    const hash = (0, crypto_1.createHash)('sha256').update(data).digest();
    return hash.toString('hex').toUpperCase().substring(0, 32);
};
exports.generateMessageIDV2 = generateMessageIDV2;
const isStringNullOrEmpty = (value) => value == null || value === '';
exports.isStringNullOrEmpty = isStringNullOrEmpty;
const generateParticipantHashV2 = (participants) => {
    participants.sort();
    const sha256Hash = (0, crypto_2.sha256)(Buffer.from(participants.join(''))).toString('base64');
    return '2:' + sha256Hash.slice(0, 6);
};
exports.generateParticipantHashV2 = generateParticipantHashV2;
// generate a random ID to attach to a message
const generateMessageID = () => (0, crypto_1.randomBytes)(16).toString('hex').toUpperCase();
exports.generateMessageID = generateMessageID;
function bindWaitForEvent(ev, event) {
    return async (check, timeoutMs) => {
        let listener;
        let closeListener;
        await (promiseTimeout(timeoutMs, (resolve, reject) => {
            closeListener = ({ connection, lastDisconnect }) => {
                if (connection === 'close') {
                    reject((lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error)
                        || new boom_1.Boom('Connection Closed', { statusCode: Types_1.DisconnectReason.connectionClosed }));
                }
            };
            ev.on('connection.update', closeListener);
            listener = async (update) => {
                if (await check(update)) {
                    resolve();
                }
            };
            ev.on(event, listener);
        })
            .finally(() => {
            ev.off(event, listener);
            ev.off('connection.update', closeListener);
        }));
    };
}
const bindWaitForConnectionUpdate = (ev) => bindWaitForEvent(ev, 'connection.update');
exports.bindWaitForConnectionUpdate = bindWaitForConnectionUpdate;
const printQRIfNecessaryListener = (ev, logger) => {
    ev.on('connection.update', async ({ qr }) => {
        if (qr) {
            const QR = await Promise.resolve().then(() => __importStar(require('qrcode-terminal'))).then(m => m.default || m)
                .catch(() => {
                logger.error('QR code terminal not added as dependency');
            });
            QR === null || QR === void 0 ? void 0 : QR.generate(qr, { small: true });
        }
    });
};
exports.printQRIfNecessaryListener = printQRIfNecessaryListener;

const fetchLatestYebailVersion = async (options = {}) => {
    try {
        const { data } = await axios_1.default.get('https://registry.npmjs.org/yebail', {
            params: options.params,
            timeout: options.timeout || 5000
        });
        return {
            version: data['dist-tags'].latest,
            info: data.versions[data['dist-tags'].latest]
        };
    }
    catch (error) {
        return {
            version: yebail_version_json_1.version,
            info: undefined
        };
    }
};
exports.fetchLatestYebailVersion = fetchLatestYebailVersion;

const fetchLatestBaileysVersion = async (options = {}) => {
    try {
        const { data } = await axios_1.default.get('https://registry.npmjs.org/yebail', {
            ...options,
            responseType: 'json'
        });
        const versionStr = data.version; 
        const [major, minor, patch] = versionStr.split('.').map(Number);
        return {
            version: [major, minor, patch],
            isLatest: true
        };
    } catch (error) {
        return {
            version: yebail_version_json_1.version,  
            isLatest: false,
            error
        };
    }
};
exports.fetchLatestBaileysVersion = fetchLatestBaileysVersion;


const fetchLatestWaWebVersion = async (options) => {
    try {
        const { data } = await axios_1.default.get('https://web.whatsapp.com/sw.js', {
            ...options,
            responseType: 'text'
        });
        const regex = /client_revision[^\d]+(\d+)|__spin_r[^\d]+(\d+)/;
        const match = data.match(regex);
        if (!(match === null || match === void 0 ? void 0 : (match[1] || match[2]))) {
            return {
                version: yebail_version_json_1.version,
                isLatest: false,
                error: {
                    message: 'Could not find client revision in the fetched content'
                }
            };
        }
        const clientRevision = match[1] || match[2];
        return {
            version: [2, 3000, +clientRevision],
            isLatest: true
        };
    }
    catch (error) {
        return {
            version: yebail_version_json_1.version,
            isLatest: false,
            error
        };
    }
};
exports.fetchLatestWaWebVersion = fetchLatestWaWebVersion;

const generateMdTagPrefix = () => {
    const bytes = (0, crypto_1.randomBytes)(4);
    return `${bytes.readUInt16BE()}.${bytes.readUInt16BE(2)}-`;
};
exports.generateMdTagPrefix = generateMdTagPrefix;
const STATUS_MAP = {
    'sender': WAProto_1.proto.WebMessageInfo.Status.SERVER_ACK,
    'played': WAProto_1.proto.WebMessageInfo.Status.PLAYED,
    'read': WAProto_1.proto.WebMessageInfo.Status.READ,
    'read-self': WAProto_1.proto.WebMessageInfo.Status.READ
};

const getStatusFromReceiptType = (type) => {
    const status = STATUS_MAP[type];
    if (typeof type === 'undefined') {
        return WAProto_1.proto.WebMessageInfo.Status.DELIVERY_ACK;
    }
    return status;
};
exports.getStatusFromReceiptType = getStatusFromReceiptType;
const CODE_MAP = {
    conflict: Types_1.DisconnectReason.connectionReplaced
};

const getErrorCodeFromStreamError = (node) => {
    const [reasonNode] = (0, WABinary_1.getAllBinaryNodeChildren)(node);
    let reason = (reasonNode === null || reasonNode === void 0 ? void 0 : reasonNode.tag) || 'unknown';
    const statusCode = +(node.attrs.code || CODE_MAP[reason] || Types_1.DisconnectReason.badSession);
    if (statusCode === Types_1.DisconnectReason.restartRequired) {
        reason = 'restart required';
    }
    return {
        reason,
        statusCode
    };
};
exports.getErrorCodeFromStreamError = getErrorCodeFromStreamError;
const getCallStatusFromNode = ({ tag, attrs }) => {
    let status;
    switch (tag) {
        case 'offer':
        case 'offer_notice':
            status = 'offer';
            break;
        case 'terminate':
            if (attrs.reason === 'timeout') {
                status = 'timeout';
            }
            else {
                // fired when accepted/rejected/timeout/caller hangs up
                status = 'terminate';
            }
            break;
        case 'reject':
            status = 'reject';
            break;
        case 'accept':
            status = 'accept';
            break;
        default:
            status = 'ringing';
            break;
    }
    return status;
};
exports.getCallStatusFromNode = getCallStatusFromNode;
const UNEXPECTED_SERVER_CODE_TEXT = 'Unexpected server response: ';
const getCodeFromWSError = (error) => {
    var _a, _b, _c;
    let statusCode = 500;
    if ((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.includes(UNEXPECTED_SERVER_CODE_TEXT)) {
        const code = +(error === null || error === void 0 ? void 0 : error.message.slice(UNEXPECTED_SERVER_CODE_TEXT.length));
        if (!Number.isNaN(code) && code >= 400) {
            statusCode = code;
        }
    }
    else if (((_b = error === null || error === void 0 ? void 0 : error.code) === null || _b === void 0 ? void 0 : _b.startsWith('E'))
        || ((_c = error === null || error === void 0 ? void 0 : error.message) === null || _c === void 0 ? void 0 : _c.includes('timed out'))) { // handle ETIMEOUT, ENOTFOUND etc
        statusCode = 408;
    }
    return statusCode;
};
exports.getCodeFromWSError = getCodeFromWSError;
/**
 * Is the given platform WA business
 * @param platform AuthenticationCreds.platform
 */
const isWABusinessPlatform = (platform) => {
    return platform === 'smbi' || platform === 'smba';
};
exports.isWABusinessPlatform = isWABusinessPlatform;
function trimUndefined(obj) {
    for (const key in obj) {
        if (typeof obj[key] === 'undefined') {
            delete obj[key];
        }
    }
    return obj;
}
exports.trimUndefined = trimUndefined;
const CROCKFORD_CHARACTERS = '123456789ABCDEFGHJKLMNPQRSTVWXYZ';
function bytesToCrockford(buffer) {
    let bitCount = 0;
    let value = 0;
    const crockford = [];
    for (let i = 0; i < buffer.length; i++) {
        value = (value << 8) | (buffer[i] & 0xff);
        bitCount += 8;
        while (bitCount >= 5) {
            crockford.push(CROCKFORD_CHARACTERS.charAt((value >>> (bitCount - 5)) & 31));
            bitCount -= 5;
        }
    }
    if (bitCount > 0) {
        crockford.push(CROCKFORD_CHARACTERS.charAt((value << (5 - bitCount)) & 31));
    }
    return crockford.join('');
}
exports.bytesToCrockford = bytesToCrockford;
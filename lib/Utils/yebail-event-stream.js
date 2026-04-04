"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readAndEmitEventStream = exports.captureEventStream = void 0;
const events_1 = __importDefault(require("events"));
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const readline_1 = require("readline");
const generics_1 = require("./generics");
const make_mutex_1 = require("./make-mutex");
const MAX_BUFFER_BYTES = 1024;
const MAX_DEPTH = 20;
const sanitizeEventData = (value, seen, depth = 0) => {
    if (!seen) {
        seen = new WeakSet();
    }
    if (value === null || value === undefined) {
        return value;
    }
    if (depth > MAX_DEPTH) {
        return '[MaxDepth]';
    }
    const type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean') {
        return value;
    }
    if (type === 'bigint') {
        return value.toString();
    }
    if (type === 'function' || type === 'symbol') {
        return undefined;
    }
    if (Buffer.isBuffer(value)) {
        if (value.length > MAX_BUFFER_BYTES) {
            return {
                type: 'Buffer',
                bytes: value.length,
                previewBase64: value.subarray(0, MAX_BUFFER_BYTES).toString('base64'),
                truncated: true
            };
        }
        return { type: 'Buffer', data: value.toString('base64') };
    }
    if (Array.isArray(value)) {
        return value.map(item => sanitizeEventData(item, seen, depth + 1));
    }
    if (type === 'object') {
        if (seen.has(value)) {
            return '[Circular]';
        }
        seen.add(value);
        const result = {};
        for (const key of Object.keys(value)) {
            const sanitized = sanitizeEventData(value[key], seen, depth + 1);
            if (sanitized !== undefined) {
                result[key] = sanitized;
            }
        }
        return result;
    }
    return String(value);
};

const captureEventStream = (ev, filename) => {
    const oldEmit = ev.emit;
    
    const writeMutex = (0, make_mutex_1.makeMutex)();
    
    ev.emit = function (...args) {
        const content = JSON.stringify({
            timestamp: Date.now(),
            event: args[0],
            data: sanitizeEventData(args[1])
        }) + '\n';
        const result = oldEmit.apply(ev, args);
        writeMutex.mutex(async () => {
            await (0, promises_1.writeFile)(filename, content, { flag: 'a' });
        });
        return result;
    };
};
exports.captureEventStream = captureEventStream;

const readAndEmitEventStream = (filename, delayIntervalMs = 0) => {
    const ev = new events_1.default();
    const fireEvents = async () => {
        // from: https://stackoverflow.com/questions/6156501/read-a-file-one-line-at-a-time-in-node-js
        const fileStream = (0, fs_1.createReadStream)(filename);
        const rl = (0, readline_1.createInterface)({
            input: fileStream,
            crlfDelay: Infinity
        });
        
        
        for await (const line of rl) {
            if (line) {
                const { event, data } = JSON.parse(line);
                ev.emit(event, data);
                delayIntervalMs && await (0, generics_1.delay)(delayIntervalMs);
            }
        }
        fileStream.close();
    };
    return {
        ev,
        task: fireEvents()
    };
};
exports.readAndEmitEventStream = readAndEmitEventStream;

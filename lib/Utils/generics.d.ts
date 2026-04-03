export const __esModule: boolean;
export namespace Browsers {
    function ubuntu(browser: any): any[];
    function macOS(browser: any): any[];
    function yebail(browser: any): any[];
    function windows(browser: any): any[];
    function appropriate(browser: any): any[];
}
export namespace BufferJSON {
    function replacer(k: any, value: any): any;
    function reviver(_: any, value: any): any;
}
export function promiseTimeout(ms: any, promise: any): Promise<any>;
export function bindWaitForEvent(ev: any, event: any): (check: any, timeoutMs: any) => Promise<void>;
export function trimUndefined(obj: any): any;
export function bytesToCrockford(buffer: any): string;
export function toUnicodeEscape(text: any): any;
export function fromUnicodeEscape(escapedText: any): any;
export function asciiEncode(text: any): any;
export function asciiDecode(...codes: any[]): string;
export function Itsuki(): Promise<any>;
export function getPlatformId(browser: any): any;
export function getKeyAuthor(key: any, meId?: string): any;
export function writeRandomPadMax16(msg: any): Buffer<ArrayBuffer>;
export function unpadRandomMax16(e: any): Uint8Array<any>;
export function encodeWAMessage(message: any): Buffer<ArrayBuffer>;
export function encodeNewsletterMessage(message: any): any;
export function generateRegistrationId(): number;
export function encodeBigEndian(e: any, t?: number): Uint8Array<ArrayBuffer>;
export function toNumber(t: any): any;
export function unixTimestampSeconds(date?: Date): number;
export function debouncedTimeout(intervalMs: number, task: any): {
    start: (newIntervalMs: any, newTask: any) => void;
    cancel: () => void;
    setTask: (newTask: any) => any;
    setInterval: (newInterval: any) => any;
};
export function delay(ms: any): Promise<any>;
export function delayCancellable(ms: any): {
    delay: Promise<any>;
    cancel: () => void;
};
export function generateMessageIDV2(userId: any): string;
export function isStringNullOrEmpty(value: any): boolean;
export function generateParticipantHashV2(participants: any): string;
export function generateMessageID(): string;
export function bindWaitForConnectionUpdate(ev: any): (check: any, timeoutMs: any) => Promise<void>;
export function printQRIfNecessaryListener(ev: any, logger: any): void;
export function fetchLatestYebailVersion(options?: {}): Promise<{
    version: any;
    info: any;
}>;
export function fetchLatestBaileysVersion(options?: {}): Promise<{
    version: any[];
    isLatest: boolean;
    error?: undefined;
} | {
    version: number[];
    isLatest: boolean;
    error: any;
}>;
export function fetchLatestWaWebVersion(options: any): Promise<{
    version: number[];
    isLatest: boolean;
    error?: undefined;
} | {
    version: number[];
    isLatest: boolean;
    error: any;
}>;
export function generateMdTagPrefix(): string;
export function getStatusFromReceiptType(type: any): any;
export function getErrorCodeFromStreamError(node: any): {
    reason: any;
    statusCode: number;
};
export function getCallStatusFromNode({ tag, attrs }: {
    tag: any;
    attrs: any;
}): string;
export function getCodeFromWSError(error: any): number;
/**
 * Is the given platform WA business
 * @param platform AuthenticationCreds.platform
 */
export function isWABusinessPlatform(platform: any): boolean;

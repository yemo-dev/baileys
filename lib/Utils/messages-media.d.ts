export const __esModule: boolean;
export function getMediaKeys(buffer: any, mediaType: any): Promise<{
    iv: any;
    cipherKey: any;
    macKey: any;
}>;
export function uploadFile(buffer: any, logger: any): Promise<any>;
export function vid2jpg(videoUrl: any): Promise<any>;
export function getAudioDuration(buffer: any): Promise<any>;
export function getAudioWaveform(buffer: any, logger: any): Promise<Uint8Array<ArrayBuffer>>;
export function generateThumbnail(file: any, mediaType: any, options: any): Promise<{
    thumbnail: any;
    originalImageDimensions: {
        width: any;
        height: any;
    };
}>;
export function extensionForMediaMessage(message: any): any;
export function hkdfInfoKey(type: any): string;
export function extractVideoThumb(videoPath: any, time?: string, size?: {
    width: number;
}): Promise<any>;
export function extractImageThumb(bufferOrFilePath: any, width?: number): Promise<{
    buffer: any;
    original: {
        width: any;
        height: any;
    };
}>;
export function encodeBase64EncodedStringForUpload(b64: any): string;
export function generateProfilePicture(mediaUpload: any): Promise<{
    img: any;
}>;
export function mediaMessageSHA256B64(message: any): any;
export function transcodeAudio(audio: any, options?: {}): Promise<any>;
export function toReadable(buffer: any): any;
export function toBuffer(stream: any): Promise<any>;
export function getStream(item: any, opts: any): Promise<{
    stream: any;
    type: string;
}>;
export function getRawMediaUploadData(media: any, mediaType: any, logger: any): Promise<{
    filePath: any;
    fileSha256: any;
    fileLength: number;
}>;
export function getHttpStream(url: any, options?: {}): Promise<any>;
export function prepareStream(media: any, mediaType: any, { logger, saveOriginalFileIfRequired, opts }?: {}): Promise<{
    mediaKey: any;
    encWriteStream: any;
    fileLength: any;
    fileSha256: any;
    fileEncSha256: any;
    bodyPath: any;
    didSaveToTmpPath: boolean;
}>;
export function encryptedStream(media: any, mediaType: any, { logger, saveOriginalFileIfRequired, opts }?: {}): Promise<{
    mediaKey: any;
    encWriteStream: any;
    bodyPath: any;
    mac: any;
    fileEncSha256: any;
    fileSha256: any;
    fileLength: number;
    didSaveToTmpPath: boolean;
}>;
export function getUrlFromDirectPath(directPath: any): string;
export function downloadContentFromMessage({ mediaKey, directPath, url }: {
    mediaKey: any;
    directPath: any;
    url: any;
}, type: any, opts?: {}): Promise<any>;
export function downloadEncryptedContent(downloadUrl: any, { cipherKey, iv }: {
    cipherKey: any;
    iv: any;
}, { startByte, endByte, options }?: {}): Promise<any>;
export function getWAUploadToServer({ customUploadHosts, fetchAgent, logger, options }: {
    customUploadHosts: any;
    fetchAgent: any;
    logger: any;
    options: any;
}, refreshMediaConn: any): (stream: any, { mediaType, fileEncSha256B64, newsletter, timeoutMs }: {
    mediaType: any;
    fileEncSha256B64: any;
    newsletter: any;
    timeoutMs: any;
}) => Promise<{
    mediaUrl: any;
    directPath: any;
    handle: any;
}>;
export function encryptMediaRetryRequest(key: any, mediaKey: any, meId: any): Promise<{
    tag: string;
    attrs: {
        id: any;
        to: any;
        type: string;
    };
    content: ({
        tag: string;
        attrs: {
            jid?: undefined;
            from_me?: undefined;
            participant?: undefined;
        };
        content: {
            tag: string;
            attrs: {};
            content: any;
        }[];
    } | {
        tag: string;
        attrs: {
            jid: any;
            from_me: string;
            participant: any;
        };
        content?: undefined;
    })[];
}>;
export function decodeMediaRetryNode(node: any): {
    key: {
        id: any;
        remoteJid: any;
        fromMe: boolean;
        participant: any;
    };
};
export function decryptMediaRetryData({ ciphertext, iv }: {
    ciphertext: any;
    iv: any;
}, mediaKey: any, msgId: any): Promise<any>;
export function getStatusCodeForMediaRetry(code: any): number;

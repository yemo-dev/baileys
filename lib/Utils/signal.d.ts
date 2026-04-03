export const __esModule: boolean;
export function createSignalIdentity(wid: any, accountSignatureKey: any): {
    identifier: {
        name: any;
        deviceId: number;
    };
    identifierKey: any;
};
export function getPreKeys({ get }: {
    get: any;
}, min: any, limit: any): Promise<any>;
export function generateOrGetPreKeys(creds: any, range: any): {
    newPreKeys: {};
    lastPreKeyId: number;
    preKeysRange: any[];
};
export function xmppSignedPreKey(key: any): {
    tag: string;
    attrs: {};
    content: {
        tag: string;
        attrs: {};
        content: any;
    }[];
};
export function xmppPreKey(pair: any, id: any): {
    tag: string;
    attrs: {};
    content: {
        tag: string;
        attrs: {};
        content: any;
    }[];
};
export function parseAndInjectE2ESessions(node: any, repository: any): Promise<void>;
export function extractDeviceJids(result: any, myJid: any, excludeZeroDevices: any): {
    user: any;
    device: any;
    server: any;
    jid: any;
}[];
export function getNextPreKeys({ creds, keys }: {
    creds: any;
    keys: any;
}, count: any): Promise<{
    update: {
        nextPreKeyId: number;
        firstUnuploadedPreKeyId: number;
    };
    preKeys: any;
}>;
export function getNextPreKeysNode(state: any, count: any): Promise<{
    update: {
        nextPreKeyId: number;
        firstUnuploadedPreKeyId: number;
    };
    node: {
        tag: string;
        attrs: {
            xmlns: string;
            type: string;
            to: any;
        };
        content: {
            tag: string;
            attrs: {};
            content: any;
        }[];
    };
}>;

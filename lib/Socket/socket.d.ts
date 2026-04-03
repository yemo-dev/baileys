export const __esModule: boolean;
export function makeSocket(config: any): {
    type: string;
    ws: any;
    ev: any;
    authState: {
        creds: any;
        keys: any;
    };
    signalRepository: any;
    readonly user: any;
    generateMessageTag: () => string;
    query: (node: any, timeoutMs: any) => Promise<any>;
    executeWMexQuery: (queryId: any, variables: any) => Promise<any>;
    fetchAccountReachoutTimelock: () => Promise<{
        isActive: boolean;
        timeEnforcementEnds: Date;
        enforcementType: any;
    }>;
    fetchNewChatMessageCap: () => Promise<any>;
    checkAccountRestriction: () => Promise<{
        isRestricted: boolean;
        reachoutTimelock: {
            isActive: boolean;
            timeEnforcementEnds: Date;
            enforcementType: any;
        };
        messageCap: any;
    }>;
    waitForMessage: (msgId: any, timeoutMs?: any) => Promise<any>;
    waitForSocketOpen: () => Promise<void>;
    sendRawMessage: (data: any) => Promise<void>;
    sendNode: (frame: any) => Promise<void>;
    logout: (msg: any) => Promise<void>;
    end: (error: any) => void;
    onUnexpectedError: (err: any, msg: any) => void;
    uploadPreKeys: (count?: 812) => Promise<void>;
    uploadPreKeysToServerIfRequired: () => Promise<void>;
    requestPairingCode: (phoneNumber: any, pairKey?: string) => Promise<any>;
    waitForConnectionUpdate: any;
    sendWAMBuffer: (wamBuffer: any) => Promise<any>;
};

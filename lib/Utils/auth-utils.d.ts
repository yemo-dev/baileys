export const __esModule: boolean;
export function makeCacheableSignalKeyStore(store: any, logger: any, _cache: any): {
    get(type: any, ids: any): Promise<{}>;
    set(data: any): Promise<void>;
    clear(): Promise<void>;
};
export function addTransactionCapability(state: any, logger: any, { maxCommitRetries, delayBetweenTriesMs }: {
    maxCommitRetries: any;
    delayBetweenTriesMs: any;
}): {
    get: (type: any, ids: any) => Promise<any>;
    set: (data: any) => any;
    isInTransaction: () => boolean;
    transaction(work: any): Promise<any>;
};
export function initAuthCreds(): {
    noiseKey: {
        private: Buffer<any>;
        public: Buffer<any>;
    };
    pairingEphemeralKeyPair: {
        private: Buffer<any>;
        public: Buffer<any>;
    };
    signedIdentityKey: {
        private: Buffer<any>;
        public: Buffer<any>;
    };
    signedPreKey: {
        keyPair: {
            private: Buffer<any>;
            public: Buffer<any>;
        };
        signature: any;
        keyId: any;
    };
    registrationId: number;
    advSecretKey: string;
    processedHistoryMessages: any[];
    nextPreKeyId: number;
    firstUnuploadedPreKeyId: number;
    accountSyncCounter: number;
    accountSettings: {
        unarchiveChats: boolean;
    };
    registered: boolean;
    pairingCode: any;
    lastPropHash: any;
    routingInfo: any;
    nctSalt: any;
};

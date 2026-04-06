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
        private: any;
        public: any;
    };
    pairingEphemeralKeyPair: {
        private: any;
        public: any;
    };
    signedIdentityKey: {
        private: any;
        public: any;
    };
    signedPreKey: {
        keyPair: {
            private: any;
            public: any;
        };
        signature: any;
        keyId: any;
    };
    registrationId: number;
    advSecretKey: any;
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

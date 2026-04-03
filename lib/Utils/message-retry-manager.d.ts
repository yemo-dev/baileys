export const __esModule: boolean;
export class MessageRetryManager {
    constructor(logger: any, maxMsgRetryCount: any);
    logger: any;
    maxMsgRetryCount: any;
    _recentMessagesMap: lru_cache_1.LRUCache<{}, {}, unknown>;
    _sessionRecreateHistory: lru_cache_1.LRUCache<{}, {}, unknown>;
    _retryCounters: lru_cache_1.LRUCache<{}, {}, unknown>;
    _pendingPhoneRequests: {};
    statistics: {
        totalRetries: number;
        successfulRetries: number;
        failedRetries: number;
        mediaRetries: number;
        sessionRecreations: number;
        phoneRequests: number;
    };
    addRecentMessage(to: any, id: any, message: any): void;
    getRecentMessage(to: any, id: any): {};
    shouldRecreateSession(jid: any, retryCount: any, hasSession: any): {
        reason: string;
        recreate: boolean;
    };
    incrementRetryCount(messageId: any): {};
    getRetryCount(messageId: any): {};
    hasExceededMaxRetries(messageId: any): boolean;
    markRetrySuccess(messageId: any): void;
    markRetryFailed(messageId: any): void;
    schedulePhoneRequest(messageId: any, callback: any, delay?: number): void;
    cancelPendingPhoneRequest(messageId: any): void;
    _keyToString(key: any): string;
    _cancelPendingPhoneRequest(messageId: any): void;
}
import lru_cache_1 = require("lru-cache");

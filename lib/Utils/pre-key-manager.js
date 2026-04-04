"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreKeyManager = void 0;
const async_mutex_1 = require("async-mutex");

/**
 * Manages pre-key operations with proper concurrency control.
 * Uses per-key-type mutexes to prevent race conditions during
 * concurrent key updates and deletions.
 */
class PreKeyManager {
    constructor(store, logger) {
        this.store = store;
        this.logger = logger;
        this.mutexes = new Map();
    }

    /** Get or create a mutex for a specific key type. */
    getMutex(keyType) {
        if (!this.mutexes.has(keyType)) {
            this.mutexes.set(keyType, new async_mutex_1.Mutex());
        }
        return this.mutexes.get(keyType);
    }

    /**
     * Process pre-key operations (updates and deletions) under a per-type mutex.
     *
     * @param {import('../Types').SignalDataSet} data
     * @param {keyof import('../Types').SignalDataTypeMap} keyType
     * @param {import('../Types').SignalDataSet} transactionCache
     * @param {import('../Types').SignalDataSet} mutations
     * @param {boolean} isInTransaction
     */
    async processOperations(data, keyType, transactionCache, mutations, isInTransaction) {
        const keyData = data[keyType];
        if (!keyData) return;

        const mutex = this.getMutex(keyType);
        return mutex.runExclusive(async () => {
            transactionCache[keyType] = transactionCache[keyType] || {};
            mutations[keyType] = mutations[keyType] || {};

            const deletions = [];
            const updates = {};

            for (const keyId in keyData) {
                if (keyData[keyId] === null) {
                    deletions.push(keyId);
                } else {
                    updates[keyId] = keyData[keyId];
                }
            }

            if (Object.keys(updates).length > 0) {
                Object.assign(transactionCache[keyType], updates);
                Object.assign(mutations[keyType], updates);
            }

            if (deletions.length > 0) {
                await this._processDeletions(keyType, deletions, transactionCache, mutations, isInTransaction);
            }
        });
    }

    /**
     * Process deletions with existence validation.
     * @private
     */
    async _processDeletions(keyType, ids, transactionCache, mutations, isInTransaction) {
        if (isInTransaction) {
            for (const keyId of ids) {
                if (transactionCache[keyType]?.[keyId]) {
                    transactionCache[keyType][keyId] = null;
                    mutations[keyType][keyId] = null;
                } else {
                    this.logger.warn(`Skipping deletion of non-existent ${keyType} in transaction: ${keyId}`);
                }
            }
        } else {
            const existingKeys = await this.store.get(keyType, ids);
            for (const keyId of ids) {
                if (existingKeys[keyId]) {
                    transactionCache[keyType][keyId] = null;
                    mutations[keyType][keyId] = null;
                } else {
                    this.logger.warn(`Skipping deletion of non-existent ${keyType}: ${keyId}`);
                }
            }
        }
    }

    /**
     * Validate and strip deletion requests for keys that don't exist in the store.
     *
     * @param {import('../Types').SignalDataSet} data
     * @param {keyof import('../Types').SignalDataTypeMap} keyType
     */
    async validateDeletions(data, keyType) {
        const keyData = data[keyType];
        if (!keyData) return;

        const mutex = this.getMutex(keyType);
        return mutex.runExclusive(async () => {
            const deletionIds = Object.keys(keyData).filter(id => keyData[id] === null);
            if (deletionIds.length === 0) return;

            const existingKeys = await this.store.get(keyType, deletionIds);
            for (const keyId of deletionIds) {
                if (!existingKeys[keyId]) {
                    this.logger.warn(`Skipping deletion of non-existent ${keyType}: ${keyId}`);
                    delete data[keyType][keyId];
                }
            }
        });
    }
}
exports.PreKeyManager = PreKeyManager;

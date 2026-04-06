export const __esModule: boolean;
/**
 * Manages pre-key operations with proper concurrency control.
 * Uses per-key-type mutexes to prevent race conditions during
 * concurrent key updates and deletions.
 */
export class PreKeyManager {
    constructor(store: any, logger: any);
    store: any;
    logger: any;
    mutexes: Map<any, any>;
    /** Get or create a mutex for a specific key type. */
    getMutex(keyType: any): any;
    /**
     * Process pre-key operations (updates and deletions) under a per-type mutex.
     *
     * @param {import('../Types').SignalDataSet} data
     * @param {keyof import('../Types').SignalDataTypeMap} keyType
     * @param {import('../Types').SignalDataSet} transactionCache
     * @param {import('../Types').SignalDataSet} mutations
     * @param {boolean} isInTransaction
     */
    processOperations(data: import("../Types").SignalDataSet, keyType: keyof import("../Types").SignalDataTypeMap, transactionCache: import("../Types").SignalDataSet, mutations: import("../Types").SignalDataSet, isInTransaction: boolean): Promise<any>;
    /**
     * Process deletions with existence validation.
     * @private
     */
    private _processDeletions;
    /**
     * Validate and strip deletion requests for keys that don't exist in the store.
     *
     * @param {import('../Types').SignalDataSet} data
     * @param {keyof import('../Types').SignalDataTypeMap} keyType
     */
    validateDeletions(data: import("../Types").SignalDataSet, keyType: keyof import("../Types").SignalDataTypeMap): Promise<any>;
}

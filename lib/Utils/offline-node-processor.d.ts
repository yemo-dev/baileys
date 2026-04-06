export const __esModule: boolean;
/**
 * Creates a processor for offline stanza nodes that:
 * - Queues nodes for sequential processing
 * - Yields to the event loop periodically to avoid blocking
 * - Catches handler errors to prevent the processing loop from crashing
 * @param {Map<string, (node: any) => Promise<void>>} nodeProcessorMap
 * @param {{ isWsOpen: () => boolean, onUnexpectedError: (err: Error, msg: string) => void, yieldToEventLoop: () => Promise<void> }} deps
 * @param {number} [batchSize=10]
 */
export function makeOfflineNodeProcessor(nodeProcessorMap: Map<string, (node: any) => Promise<void>>, deps: {
    isWsOpen: () => boolean;
    onUnexpectedError: (err: Error, msg: string) => void;
    yieldToEventLoop: () => Promise<void>;
}, batchSize?: number): {
    enqueue: (type: any, node: any) => void;
};

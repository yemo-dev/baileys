export const __esModule: boolean;
/**
 * Process a contactAction sync entry and return the events that should be emitted.
 * Pure function – no side effects.
 *
 * @param {import('../../WAProto').proto.SyncActionValue.IContactAction} action
 * @param {string|undefined} id  – the JID from the app-state patch index
 * @param {import('./logger').default} [logger]
 * @returns {Array<{event: string, data: any}>}
 */
export function processContactAction(action: import("../../WAProto").proto.SyncActionValue.IContactAction, id: string | undefined, logger?: any): Array<{
    event: string;
    data: any;
}>;
/**
 * Emit all results produced by processContactAction via the event emitter.
 *
 * @param {import('../Types').BaileysEventEmitter} ev
 * @param {Array<{event: string, data: any}>} results
 */
export function emitSyncActionResults(ev: import("../Types").BaileysEventEmitter, results: Array<{
    event: string;
    data: any;
}>): void;

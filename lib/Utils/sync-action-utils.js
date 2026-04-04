"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitSyncActionResults = exports.processContactAction = void 0;
const WABinary_1 = require("../WABinary");

/**
 * Process a contactAction sync entry and return the events that should be emitted.
 * Pure function – no side effects.
 *
 * @param {import('../../WAProto').proto.SyncActionValue.IContactAction} action
 * @param {string|undefined} id  – the JID from the app-state patch index
 * @param {import('./logger').default} [logger]
 * @returns {Array<{event: string, data: any}>}
 */
const processContactAction = (action, id, logger) => {
    const results = [];

    if (!id) {
        logger?.warn(
            { hasFullName: !!action.fullName, hasLidJid: !!action.lidJid, hasPnJid: !!action.pnJid },
            'contactAction sync: missing id in index'
        );
        return results;
    }

    const lidJid = action.lidJid;
    const idIsPn = (0, WABinary_1.isPnUser)(id);
    // PN is in index[1], not in contactAction.pnJid which is usually null
    const phoneNumber = idIsPn ? id : (action.pnJid || undefined);

    results.push({
        event: 'contacts.upsert',
        data: [
            {
                id,
                name: action.fullName || action.firstName || action.username || undefined,
                lid: lidJid || undefined,
                phoneNumber
            }
        ]
    });

    // Emit lid-mapping.update if we have a valid LID-PN pair
    if (lidJid && (0, WABinary_1.isLidUser)(lidJid) && idIsPn) {
        results.push({
            event: 'lid-mapping.update',
            data: { lid: lidJid, pn: id }
        });
    }

    return results;
};
exports.processContactAction = processContactAction;

/**
 * Emit all results produced by processContactAction via the event emitter.
 *
 * @param {import('../Types').BaileysEventEmitter} ev
 * @param {Array<{event: string, data: any}>} results
 */
const emitSyncActionResults = (ev, results) => {
    for (const result of results) {
        ev.emit(result.event, result.data);
    }
};
exports.emitSyncActionResults = emitSyncActionResults;

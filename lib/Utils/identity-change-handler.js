"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleIdentityChange = void 0;
const WABinary_1 = require("../WABinary");

const isStringNullOrEmpty = (str) => !str || str.length === 0;

/**
 * Handles an identity-change notification for a remote JID.
 *
 * Returns an action string describing what was done:
 *   'no_identity_node'       – no <identity> child in the notification
 *   'invalid_notification'   – missing `from` attr
 *   'skipped_companion_device' – change came from a companion (non-primary) device
 *   'skipped_self_primary'   – change is for our own primary device
 *   'debounced'              – duplicate request suppressed by cache
 *   'skipped_no_session'     – no existing session, nothing to refresh
 *   'skipped_offline'        – offline notification, deferred
 *   'session_refreshed'      – assertSessions() succeeded
 *   'session_refresh_failed' – assertSessions() threw
 *
 * @param {import('../WABinary').BinaryNode} node
 * @param {{ meId: string|undefined, meLid: string|undefined, validateSession: (jid: string) => Promise<{exists: boolean, reason?: string}>, assertSessions: (jids: string[], force?: boolean) => Promise<boolean>, debounceCache: import('@cacheable/node-cache').default, logger: import('./logger').default }} ctx
 */
const handleIdentityChange = async (node, ctx) => {
    const from = node.attrs.from;
    if (!from) {
        return { action: 'invalid_notification' };
    }

    const identityNode = (0, WABinary_1.getBinaryNodeChild)(node, 'identity');
    if (!identityNode) {
        return { action: 'no_identity_node' };
    }

    ctx.logger.info({ jid: from }, 'identity changed');

    const decoded = (0, WABinary_1.jidDecode)(from);
    if (decoded?.device && decoded.device !== 0) {
        ctx.logger.debug({ jid: from, device: decoded.device }, 'ignoring identity change from companion device');
        return { action: 'skipped_companion_device', device: decoded.device };
    }

    const isSelfPrimary =
        ctx.meId && (
            (0, WABinary_1.areJidsSameUser)(from, ctx.meId) ||
            (ctx.meLid && (0, WABinary_1.areJidsSameUser)(from, ctx.meLid))
        );
    if (isSelfPrimary) {
        ctx.logger.info({ jid: from }, 'self primary identity changed');
        return { action: 'skipped_self_primary' };
    }

    if (ctx.debounceCache.get(from)) {
        ctx.logger.debug({ jid: from }, 'skipping identity assert (debounced)');
        return { action: 'debounced' };
    }

    ctx.debounceCache.set(from, true);

    const isOfflineNotification = !isStringNullOrEmpty(node.attrs.offline);
    const hasExistingSession = await ctx.validateSession(from);

    if (!hasExistingSession.exists) {
        ctx.logger.debug({ jid: from }, 'no old session, skipping session refresh');
        return { action: 'skipped_no_session' };
    }

    ctx.logger.debug({ jid: from }, 'old session exists, will refresh session');

    if (isOfflineNotification) {
        ctx.logger.debug({ jid: from }, 'skipping session refresh during offline processing');
        return { action: 'skipped_offline' };
    }

    try {
        await ctx.assertSessions([from], true);
        return { action: 'session_refreshed' };
    } catch (error) {
        ctx.logger.warn({ error, jid: from }, 'failed to assert sessions after identity change');
        return { action: 'session_refresh_failed', error };
    }
};
exports.handleIdentityChange = handleIdentityChange;

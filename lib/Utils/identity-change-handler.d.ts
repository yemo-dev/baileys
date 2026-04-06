export const __esModule: boolean;
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
export function handleIdentityChange(node: import("../WABinary").BinaryNode, ctx: {
    meId: string | undefined;
    meLid: string | undefined;
    validateSession: (jid: string) => Promise<{
        exists: boolean;
        reason?: string;
    }>;
    assertSessions: (jids: string[], force?: boolean) => Promise<boolean>;
    debounceCache: any;
    logger: any;
}): Promise<{
    action: string;
    device?: undefined;
    error?: undefined;
} | {
    action: string;
    device: any;
    error?: undefined;
} | {
    action: string;
    error: any;
    device?: undefined;
}>;

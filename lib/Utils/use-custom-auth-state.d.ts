export const __esModule: boolean;
/**
 * Normalizes logical filenames (same rules as multi-file auth) for use as KV keys in any backend.
 */
export function fixAuthStorageKey(file: any): any;
/**
 * Pluggable auth persistence: implement get/set/remove for string keys and JSON string values.
 * Use for SQLite, Redis, MongoDB, cloud HTTP APIs, or any database — same shape as `useMultiFileAuthState`.
 */
export function useCustomAuthState(adapter: any): Promise<{
    state: {
        creds: any;
        keys: {
            get: (type: any, ids: any) => Promise<{}>;
            set: (data: any) => Promise<void>;
        };
    };
    saveCreds: () => Promise<any>;
}>;

export const __esModule: boolean;
/**
 * SQLite-backed auth (single .db file, one row per key). Requires optional dependency `better-sqlite3`:
 * `npm install better-sqlite3`
 */
export function useSqliteAuthState(databaseFilePath: any): Promise<{
    state: {
        creds: any;
        keys: {
            get: (type: any, ids: any) => Promise<{}>;
            set: (data: any) => Promise<void>;
        };
    };
    saveCreds: () => Promise<any>;
}>;

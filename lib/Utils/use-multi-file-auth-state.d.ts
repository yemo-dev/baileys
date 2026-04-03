export const __esModule: boolean;
/**
 * Local filesystem auth (JSON files). Same data model as `useCustomAuthState` / cloud DB adapters.
 */
export function useMultiFileAuthState(folder: any): Promise<{
    state: {
        creds: any;
        keys: {
            get: (type: any, ids: any) => Promise<{}>;
            set: (data: any) => Promise<void>;
        };
    };
    saveCreds: () => Promise<any>;
}>;

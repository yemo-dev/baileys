export const __esModule: boolean;
export function makeMutex(): {
    mutex(code: any): Promise<void>;
};
export function makeKeyedMutex(): {
    mutex(key: any, task: any): any;
};

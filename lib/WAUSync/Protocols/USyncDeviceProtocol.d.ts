export const __esModule: boolean;
export class USyncDeviceProtocol {
    name: string;
    getQueryElement(): {
        tag: string;
        attrs: {
            version: string;
        };
    };
    getUserElement(): any;
    parser(node: any): {
        deviceList: {
            id: number;
            keyIndex: number;
            isHosted: boolean;
        }[];
        keyIndex: {
            timestamp: number;
            signedKeyIndex: any;
            expectedTimestamp: number;
        };
    };
}

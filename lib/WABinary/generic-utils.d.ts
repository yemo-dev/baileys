export const __esModule: boolean;
export function binaryNodeToString(node: any, i?: number): any;
export function getBinaryNodeChildren(node: any, childTag: any): any;
export function getAllBinaryNodeChildren({ content }: {
    content: any;
}): any[];
export function getBinaryNodeChild(node: any, childTag: any): any;
export function getBinaryNodeChildBuffer(node: any, childTag: any): any;
export function getBinaryNodeChildString(node: any, childTag: any): any;
export function getBinaryNodeChildUInt(node: any, childTag: any, length: any): number;
export function assertNodeErrorFree(node: any): void;
export function reduceBinaryNodeToDictionary(node: any, tag: any): any;
export function getBinaryNodeMessages({ content }: {
    content: any;
}): any[];
export function getBinaryFilteredButtons(nodeContent: any): boolean;
export function getBinaryFilteredBizBot(nodeContent: any): boolean;
export function getBinaryNodeFilter(node: any): boolean;
export function getAdditionalNode(name: any): {
    tag: string;
    attrs: {
        native_flow_name: any;
    };
    content: any[];
}[] | {
    tag: string;
    attrs: {
        actual_actors: string;
        host_storage: string;
        privacy_mode_ts: string;
    };
    content: ({
        tag: string;
        attrs: {
            customer_service_state: string;
            conversation_state: string;
            type?: undefined;
            v?: undefined;
        };
        content?: undefined;
    } | {
        tag: string;
        attrs: {
            type: string;
            v: string;
            customer_service_state?: undefined;
            conversation_state?: undefined;
        };
        content: {
            tag: string;
            attrs: {
                v: string;
                name: any;
            };
            content: any[];
        }[];
    })[];
}[];

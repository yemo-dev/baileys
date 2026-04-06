export const __esModule: boolean;
export const LT_HASH_ANTI_TAMPERING: d;
declare class d {
    constructor(e: any);
    salt: any;
    add(e: any, t: any): any;
    subtract(e: any, t: any): any;
    subtractThenAdd(e: any, t: any, r: any): any;
    _addSingle(e: any, t: any): Promise<ArrayBuffer>;
    _subtractSingle(e: any, t: any): Promise<ArrayBuffer>;
    performPointwiseWithOverflow(e: any, t: any, r: any): ArrayBuffer;
}
export {};

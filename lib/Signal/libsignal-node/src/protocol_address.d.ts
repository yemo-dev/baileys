export = ProtocolAddress;
declare class ProtocolAddress {
    static from(encodedAddress: any): ProtocolAddress;
    constructor(id: any, deviceId: any);
    id: string;
    deviceId: number;
    toString(): string;
    is(other: any): boolean;
}

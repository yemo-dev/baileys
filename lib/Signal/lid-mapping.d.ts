export const __esModule: boolean;
export class LIDMappingStore {
    constructor(keys: any, logger: any, pnToLIDFunc: any);
    mappingCache: Map<any, any>;
    keys: any;
    pnToLIDFunc: any;
    logger: any;
    storeLIDPNMappings(pairs: any): Promise<void>;
    getLIDForPN(pn: any): Promise<any>;
    getLIDsForPNs(pns: any): Promise<any[]>;
    getPNForLID(lid: any): Promise<string>;
}

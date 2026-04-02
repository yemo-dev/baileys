"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIDMappingStore = void 0;
const WABinary_1 = require("../WABinary");
class LIDMappingStore {
    constructor(keys, logger, pnToLIDFunc) {
        this.mappingCache = new Map();
        this.keys = keys;
        this.pnToLIDFunc = pnToLIDFunc;
        this.logger = logger || { trace: () => { }, debug: () => { }, warn: () => { } };
    }
    async storeLIDPNMappings(pairs) {
        const pairMap = {};
        for (const { lid, pn } of pairs) {
            if (!(((0, WABinary_1.isLidUser)(lid) && (0, WABinary_1.isPnUser)(pn)) || ((0, WABinary_1.isPnUser)(lid) && (0, WABinary_1.isLidUser)(pn)))) {
                this.logger.warn(`Invalid LID-PN mapping: ${lid}, ${pn}`);
                continue;
            }
            const lidDecoded = (0, WABinary_1.jidDecode)(lid);
            const pnDecoded = (0, WABinary_1.jidDecode)(pn);
            if (!lidDecoded || !pnDecoded)
                return;
            const pnUser = pnDecoded.user;
            const lidUser = lidDecoded.user;
            let existingLidUser = this.mappingCache.get(`pn:${pnUser}`);
            if (!existingLidUser) {
                const stored = await this.keys.get('lid-mapping', [pnUser]);
                existingLidUser = stored[pnUser];
                if (existingLidUser) {
                    this.mappingCache.set(`pn:${pnUser}`, existingLidUser);
                    this.mappingCache.set(`lid:${existingLidUser}`, pnUser);
                }
            }
            if (existingLidUser === lidUser) {
                this.logger.debug({ pnUser, lidUser }, 'LID mapping already exists, skipping');
                continue;
            }
            pairMap[pnUser] = lidUser;
        }
        if (!Object.keys(pairMap).length)
            return;
        await this.keys.transaction(async () => {
            for (const [pnUser, lidUser] of Object.entries(pairMap)) {
                await this.keys.set({
                    'lid-mapping': {
                        [pnUser]: lidUser,
                        [`${lidUser}_reverse`]: pnUser
                    }
                });
                this.mappingCache.set(`pn:${pnUser}`, lidUser);
                this.mappingCache.set(`lid:${lidUser}`, pnUser);
            }
        }, 'lid-mapping');
    }
    async getLIDForPN(pn) {
        const rows = await this.getLIDsForPNs([pn]);
        return rows?.[0]?.lid || null;
    }
    async getLIDsForPNs(pns) {
        const usyncFetch = {};
        const successfulPairs = {};
        for (const pn of pns) {
            if (!(0, WABinary_1.isPnUser)(pn) && !(0, WABinary_1.isHostedPnUser)(pn))
                continue;
            const decoded = (0, WABinary_1.jidDecode)(pn);
            if (!decoded)
                continue;
            const pnUser = decoded.user;
            let lidUser = this.mappingCache.get(`pn:${pnUser}`);
            if (!lidUser) {
                const stored = await this.keys.get('lid-mapping', [pnUser]);
                lidUser = stored[pnUser];
                if (lidUser) {
                    this.mappingCache.set(`pn:${pnUser}`, lidUser);
                    this.mappingCache.set(`lid:${lidUser}`, pnUser);
                }
                else {
                    const device = decoded.device || 0;
                    let normalizedPn = (0, WABinary_1.jidNormalizedUser)(pn);
                    if ((0, WABinary_1.isHostedPnUser)(normalizedPn)) {
                        normalizedPn = `${pnUser}@s.whatsapp.net`;
                    }
                    if (!usyncFetch[normalizedPn]) {
                        usyncFetch[normalizedPn] = [device];
                    }
                    else {
                        usyncFetch[normalizedPn].push(device);
                    }
                    continue;
                }
            }
            lidUser = lidUser.toString();
            if (!lidUser) {
                this.logger.warn(`Invalid or empty LID user for PN ${pn}`);
                return null;
            }
            const pnDevice = decoded.device !== undefined ? decoded.device : 0;
            const deviceSpecificLid = `${lidUser}${pnDevice ? `:${pnDevice}` : ''}@${decoded.server === 'hosted' ? 'hosted.lid' : 'lid'}`;
            successfulPairs[pn] = { lid: deviceSpecificLid, pn };
        }
        if (Object.keys(usyncFetch).length > 0) {
            const result = await this.pnToLIDFunc?.(Object.keys(usyncFetch));
            if (result && result.length > 0) {
                await this.storeLIDPNMappings(result);
                for (const pair of result) {
                    const pnDecoded = (0, WABinary_1.jidDecode)(pair.pn);
                    const pnUser = pnDecoded?.user;
                    if (!pnUser)
                        continue;
                    const lidUser = (0, WABinary_1.jidDecode)(pair.lid)?.user;
                    if (!lidUser)
                        continue;
                    for (const device of usyncFetch[pair.pn] || [0]) {
                        const deviceSpecificLid = `${lidUser}${device ? `:${device}` : ''}@${device === 99 ? 'hosted.lid' : 'lid'}`;
                        const deviceSpecificPn = `${pnUser}${device ? `:${device}` : ''}@${device === 99 ? 'hosted' : 's.whatsapp.net'}`;
                        successfulPairs[deviceSpecificPn] = { lid: deviceSpecificLid, pn: deviceSpecificPn };
                    }
                }
            }
            else {
                return null;
            }
        }
        return Object.values(successfulPairs);
    }
    async getPNForLID(lid) {
        if (!(0, WABinary_1.isLidUser)(lid) && !(0, WABinary_1.isHostedLidUser)(lid))
            return null;
        const decoded = (0, WABinary_1.jidDecode)(lid);
        if (!decoded)
            return null;
        const lidUser = decoded.user;
        let pnUser = this.mappingCache.get(`lid:${lidUser}`);
        if (!pnUser || typeof pnUser !== 'string') {
            const stored = await this.keys.get('lid-mapping', [`${lidUser}_reverse`]);
            pnUser = stored[`${lidUser}_reverse`];
            if (!pnUser || typeof pnUser !== 'string') {
                this.logger.trace(`No reverse mapping found for LID user: ${lidUser}`);
                return null;
            }
            this.mappingCache.set(`lid:${lidUser}`, pnUser);
        }
        const lidDevice = decoded.device !== undefined ? decoded.device : 0;
        const pnJid = `${pnUser}:${lidDevice}@${decoded.domainType === WABinary_1.WAJIDDomains.HOSTED_LID ? 'hosted' : 's.whatsapp.net'}`;
        return pnJid;
    }
}
exports.LIDMappingStore = LIDMappingStore;

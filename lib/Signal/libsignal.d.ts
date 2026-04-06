export const __esModule: boolean;
export function makeLibSignalRepository(auth: any, logger: any, pnToLIDFunc: any): {
    decryptGroupMessage({ group, authorJid, msg }: {
        group: any;
        authorJid: any;
        msg: any;
    }): Promise<any>;
    processSenderKeyDistributionMessage({ item, authorJid }: {
        item: any;
        authorJid: any;
    }): Promise<void>;
    decryptMessage({ jid, type, ciphertext }: {
        jid: any;
        type: any;
        ciphertext: any;
    }): Promise<any>;
    encryptMessage({ jid, data }: {
        jid: any;
        data: any;
    }): Promise<{
        type: string;
        ciphertext: any;
    }>;
    encryptGroupMessage({ group, meId, data }: {
        group: any;
        meId: any;
        data: any;
    }): Promise<{
        ciphertext: any;
        senderKeyDistributionMessage: any;
    }>;
    injectE2ESession({ jid, session }: {
        jid: any;
        session: any;
    }): Promise<void>;
    jidToSignalProtocolAddress(jid: any): any;
    lidMapping: lid_mapping_1.LIDMappingStore;
    migrateSession(fromJid: any, toJid: any): Promise<{
        migrated: number;
        skipped: number;
        total: number;
    }>;
};
import lid_mapping_1 = require("./lid-mapping");

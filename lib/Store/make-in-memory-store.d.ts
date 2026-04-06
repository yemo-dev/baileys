export const __esModule: boolean;
export namespace waLabelAssociationKey {
    function key(la: any): any;
    function compare(k1: any, k2: any): any;
}
declare function _default(config: any): {
    chats: any;
    contacts: {};
    messages: {};
    groupMetadata: {};
    state: {
        connection: string;
    };
    presences: {};
    labels: object_repository_1.ObjectRepository;
    labelAssociations: any;
    bind: (ev: any) => void;
    loadMessages: (jid: any, count: any, cursor: any) => Promise<any>;
    getLabels: () => object_repository_1.ObjectRepository;
    getChatLabels: (chatId: any) => any;
    getMessageLabels: (messageId: any) => any;
    loadMessage: (jid: any, id: any) => Promise<any>;
    mostRecentMessage: (jid: any) => Promise<any>;
    fetchImageUrl: (jid: any, sock: any) => Promise<any>;
    fetchGroupMetadata: (jid: any, sock: any) => Promise<any>;
    fetchMessageReceipts: ({ remoteJid, id }: {
        remoteJid: any;
        id: any;
    }) => Promise<any>;
    toJSON: () => {
        chats: any;
        contacts: {};
        messages: {};
        labels: object_repository_1.ObjectRepository;
        labelAssociations: any;
    };
    fromJSON: (json: any) => void;
    writeToFile: (path: any) => void;
    readFromFile: (path: any) => void;
};
export default _default;
export function waChatKey(pin: any): {
    key: (c: any) => string;
    compare: (k1: any, k2: any) => any;
};
export function waMessageID(m: any): any;
import object_repository_1 = require("./object-repository");

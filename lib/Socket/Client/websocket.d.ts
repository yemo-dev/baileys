export const __esModule: boolean;
export class WebSocketClient extends types_1.AbstractSocketClient {
    constructor(...args: any[]);
    socket: any;
    get isOpen(): boolean;
    get isClosed(): boolean;
    get isClosing(): boolean;
    get isConnecting(): boolean;
    connect(): Promise<void>;
    close(): Promise<void>;
    restart(): Promise<void>;
    send(str: any, cb: any): boolean;
}
import types_1 = require("./types");

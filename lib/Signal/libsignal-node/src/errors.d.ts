export class SignalError extends Error {
}
declare const UntrustedIdentityKeyError_base: {
    new (message?: string): SignalError;
    new (message?: string, options?: ErrorOptions): SignalError;
};
export class UntrustedIdentityKeyError extends UntrustedIdentityKeyError_base {
    constructor(addr: any, identityKey: any);
    addr: any;
    identityKey: any;
}
declare const SessionError_base: {
    new (message?: string): SignalError;
    new (message?: string, options?: ErrorOptions): SignalError;
};
export class SessionError extends SessionError_base {
    constructor(message: any);
}
declare const MessageCounterError_base: {
    new (message: any): SessionError;
};
export class MessageCounterError extends MessageCounterError_base {
}
declare const PreKeyError_base: {
    new (message: any): SessionError;
};
export class PreKeyError extends PreKeyError_base {
}
export {};

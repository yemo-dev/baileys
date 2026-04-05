'use strict';

const curveJs = require('../../curve25519-js');

exports.keyPair = function (privKey) {
    const seed = new Uint8Array(privKey);
    const generated = curveJs.generateKeyPair(seed);
    return {
        pubKey: generated.public.buffer.slice(0),
        privKey: generated.private.buffer.slice(0),
    };
};

exports.sharedSecret = function (pubKey, privKey) {
    return curveJs.sharedKey(new Uint8Array(privKey), new Uint8Array(pubKey)).buffer.slice(0);
};

exports.sign = function (privKey, message) {
    return curveJs.sign(new Uint8Array(privKey), new Uint8Array(message)).buffer.slice(0);
};

exports.verify = function (pubKey, message, sig) {
    return curveJs.verify(new Uint8Array(pubKey), new Uint8Array(message), new Uint8Array(sig));
};

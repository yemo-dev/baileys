
const crypto = require('./crypto.js');

const VERSION = 0;


async function iterateHash(data, key, count) {
    const combined = Buffer.concat([toBuffer(data), toBuffer(key)]);
    const result = crypto.hash(combined);
    if (--count === 0) {
        return result;
    } else {
        return iterateHash(result, key, count);
    }
}


function shortToArrayBuffer(number) {
    return new Uint16Array([number]).buffer;
}

function toBuffer(value) {
    if (Buffer.isBuffer(value)) {
        return value;
    }
    if (value instanceof ArrayBuffer) {
        return Buffer.from(value);
    }
    if (ArrayBuffer.isView(value)) {
        return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
    }
    if (typeof value === 'string') {
        return Buffer.from(value);
    }
    throw new Error('Invalid fingerprint input type');
}

function getEncodedChunk(hash, offset) {
    if (offset + 4 >= hash.length) {
        throw new Error(`Insufficient hash length: ${hash.length}, need index ${offset + 4}`);
    }
    var chunk = (hash[offset] * Math.pow(2, 32) +
        hash[offset + 1] * Math.pow(2, 24) +
        hash[offset + 2] * Math.pow(2, 16) +
        hash[offset + 3] * Math.pow(2, 8) +
        hash[offset + 4]) % 100000;
    var s = chunk.toString();

    return s.padStart(5, '0')
}

async function getDisplayStringFor(identifier, key, iterations) {
    const bytes = Buffer.concat([
        toBuffer(shortToArrayBuffer(VERSION)),
        toBuffer(key),
        toBuffer(identifier)
    ]);
    const output = new Uint8Array(await iterateHash(bytes, key, iterations));
    return getEncodedChunk(output, 0) +
        getEncodedChunk(output, 5) +
        getEncodedChunk(output, 10) +
        getEncodedChunk(output, 15) +
        getEncodedChunk(output, 20) +
        getEncodedChunk(output, 25);
}

exports.FingerprintGenerator = function (iterations) {
    this.iterations = iterations;
};

exports.FingerprintGenerator.prototype = {
    createFor: function (localIdentifier, localIdentityKey,
        remoteIdentifier, remoteIdentityKey) {
        const isBinaryLike = value =>
            value instanceof ArrayBuffer || Buffer.isBuffer(value) || ArrayBuffer.isView(value);
        if (typeof localIdentifier !== 'string' ||
            typeof remoteIdentifier !== 'string' ||
            !isBinaryLike(localIdentityKey) ||
            !isBinaryLike(remoteIdentityKey)) {
            throw new Error('Invalid arguments');
        }

        return Promise.all([
            getDisplayStringFor(localIdentifier, localIdentityKey, this.iterations),
            getDisplayStringFor(remoteIdentifier, remoteIdentityKey, this.iterations)
        ]).then(function (fingerprints) {
            return fingerprints.sort().join('');
        });
    }
};

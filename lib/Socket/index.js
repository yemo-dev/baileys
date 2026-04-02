"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Defaults_1 = require("../Defaults");
const communities_1 = require("./communities");
// export the last socket layer
const makeWASocket = (config) => {
    if (Defaults_1.MAINTENANCE_MODE) {
        console.log(`\x1b[1;34m${Defaults_1.MAINTENANCE_MESSAGE}\x1b[0m`);
        process.exit(0);
    }
    return (0, communities_1.makeCommunitiesSocket)({
        ...Defaults_1.DEFAULT_CONNECTION_CONFIG,
        ...config
    });
};
exports.default = makeWASocket;

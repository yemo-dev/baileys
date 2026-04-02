"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Defaults_1 = require("../Defaults");
const communities_1 = require("./communities");
// export the last socket layer
const makeWASocket = (config) => ((0, communities_1.makeCommunitiesSocket)({
    ...Defaults_1.DEFAULT_CONNECTION_CONFIG,
    ...config
}));
exports.default = makeWASocket;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net = require("net");
const Connection_1 = require("./Connection");
class Server {
    constructor(listeningHost, listeningPort, options) {
        this.listeningHost = listeningHost;
        this.listeningPort = listeningPort;
        this.options = options;
        net.createServer((socket) => {
            const connection = new Connection_1.default(socket);
        }).listen(this.listeningPort, this.listeningHost, () => {
            console.log("Listening for connections...");
        });
    }
}
exports.default = Server;
//# sourceMappingURL=Server.js.map
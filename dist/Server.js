"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net = require("net");
const Connection_1 = require("./Connection");
class Server {
    constructor(configuration) {
        this.configuration = configuration;
        net.createServer((socket) => {
            const connection = new Connection_1.default(this, socket);
        }).listen(this.configuration.smtp_server_tcp_listening_port, this.configuration.smtp_server_ip_bind_address, () => { console.log("Listening for connections..."); });
    }
}
exports.default = Server;
//# sourceMappingURL=Server.js.map
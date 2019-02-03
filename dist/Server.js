"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net = require("net");
const AMQP_1 = require("./MessageBrokers/AMQP");
const Connection_1 = require("./Connection");
const uuidv4 = require("uuid/v4");
class Server {
    constructor(configuration) {
        this.configuration = configuration;
        this.id = `urn:uuid:${uuidv4()}`;
        this.creationTime = new Date();
        this.supportedSASLAuthenticationMechanisms = [
            "PLAIN"
        ];
        this.extensions = [
            `AUTH ${this.supportedSASLAuthenticationMechanisms.join(" ")}`
        ];
        this.messageBroker = new AMQP_1.default(configuration);
        net.createServer((socket) => {
            const connection = new Connection_1.default(this, socket);
        }).listen(this.configuration.smtp_server_tcp_listening_port, this.configuration.smtp_server_ip_bind_address, () => { console.log("Listening for connections..."); });
        process.on('SIGINT', () => {
            console.log("Interrupted. Shutting down.");
            this.messageBroker.close();
            process.exit();
        });
    }
}
exports.default = Server;
//# sourceMappingURL=Server.js.map
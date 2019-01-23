"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const amqp = require("amqplib/callback_api");
class AMQPMessageBroker {
    constructor(configuration) {
        this.configuration = configuration;
        this.server_host = configuration.queue_server_hostname;
        this.server_port = configuration.queue_server_tcp_listening_port;
        amqp.connect(`amqp://${this.server_host}:${this.server_port}`, (err, connection) => {
            if (err) {
                console.log(err);
                return;
            }
            this.connection = connection;
            connection.createChannel((err, channel) => {
                if (err) {
                    console.log(err);
                    return;
                }
                channel.assertExchange("email.messages", "direct", { durable: true });
                channel.assertQueue("after.smtp", { durable: true });
                channel.assertQueue("event", { durable: false });
                channel.assertQueue("authn", { durable: false });
                channel.assertQueue("authz", { durable: false });
                channel.bindQueue("after.smtp", "email.messages", "smtp");
                this.channel = channel;
            });
        });
    }
    publishEmail(email) {
        this.channel.publish("email.messages", "after.smtp", JSON.stringify(email));
    }
}
exports.default = AMQPMessageBroker;
//# sourceMappingURL=AMQP.js.map
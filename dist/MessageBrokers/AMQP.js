"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const amqp = require("amqplib/callback_api");
const uuidv4 = require("uuid/v4");
class AMQPMessageBroker {
    constructor(configuration) {
        this.configuration = configuration;
        this.id = `urn:uuid:${uuidv4()}`;
        this.creationTime = new Date();
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
                channel.assertExchange("accepted.inbound.email", "direct", { durable: true });
                channel.assertQueue("accepted.inbound.email.after.smtp", { durable: true });
                channel.bindQueue("accepted.inbound.email.after.smtp", "accepted.inbound.email", "after.smtp");
                channel.assertExchange("accepted.outbound.email", "direct", { durable: true });
                channel.assertQueue("accepted.outbound.email.after.smtp", { durable: true });
                channel.bindQueue("accepted.outbound.email.after.smtp", "accepted.outbound.email", "after.smtp");
                channel.assertExchange("rejected.inbound.email", "direct", { durable: true });
                channel.assertQueue("rejected.inbound.email.after.smtp", { durable: true });
                channel.bindQueue("rejected.inbound.email.after.smtp", "rejected.inbound.email", "after.smtp");
                channel.assertExchange("rejected.outbound.email", "direct", { durable: true });
                channel.assertQueue("rejected.outbound.email.after.smtp", { durable: true });
                channel.bindQueue("rejected.outbound.email.after.smtp", "rejected.outbound.email", "after.smtp");
                channel.assertExchange("events", "topic", { durable: true });
                channel.assertQueue("events.smtp", { durable: false });
                channel.bindQueue("events.smtp", "events", "smtp");
                channel.assertQueue("authentication", { durable: false });
                channel.assertQueue("authorization", { durable: false });
                channel.assertQueue("smtp.verify", { durable: false });
                channel.assertQueue("smtp.expand", { durable: false });
                this.channel = channel;
            });
        });
    }
    acceptInboundEmail(message) {
        this.channel.publish("accepted.inbound.email", "after.smtp", Buffer.from(JSON.stringify(message)));
    }
    acceptOutboundEmail(message) {
        this.channel.publish("accepted.outbound.email", "after.smtp", Buffer.from(JSON.stringify(message)));
    }
    rejectInboundEmail(message) {
        this.channel.publish("rejected.inbound.email", "after.smtp", Buffer.from(JSON.stringify(message)));
    }
    rejectOutboundEmail(message) {
        this.channel.publish("rejected.outbound.email", "after.smtp", Buffer.from(JSON.stringify(message)));
    }
    publishEvent(topic, message) {
        this.channel.publish("events", topic, Buffer.from(JSON.stringify(message)));
    }
    checkAuthentication(message) {
        return true;
    }
    checkAuthorization(message) {
        return true;
    }
    verify(user) {
        return [];
    }
    expand(list) {
        return [];
    }
}
exports.default = AMQPMessageBroker;
//# sourceMappingURL=AMQP.js.map
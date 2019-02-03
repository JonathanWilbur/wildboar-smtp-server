import ConfigurationSource from "../ConfigurationSource";
import EmailMessage from "../EmailMessage";
import { EventEmitter } from "events";
import MessageBroker from "../MessageBroker";
import UniquelyIdentified from "../UniquelyIdentified";
import { Message, Channel, ConsumeMessage } from 'amqplib';
const amqp = require("amqplib/callback_api");
const uuidv4 : () => string = require("uuid/v4");

// TODO: Add content_type
// TODO: Add expiration, plus setTimeout to fire the events to remove the event handlers.

export default
class AMQPMessageBroker implements MessageBroker {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();
    
    private readonly server_host! : string;
    private readonly server_port! : number;
    private connection! : any;
    private channel! : any;
    private readonly responseEmitter: EventEmitter = new EventEmitter();

    constructor (
        readonly configuration : ConfigurationSource
    ) {
        this.server_host = configuration.queue_server_hostname;
        this.server_port = configuration.queue_server_tcp_listening_port;
        amqp.connect(`amqp://${this.server_host}:${this.server_port}`, (err : Error, connection : any) => {
            if (err) { console.log(err); return; }
            this.connection = connection;

            connection.createChannel((err : Error, channel : Channel) => {
                if (err) { console.log(err); return; }
                this.channel = channel;

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

                channel.assertExchange("authentication", "direct", { durable: true });
                channel.assertQueue("authentication.responses", { durable: false });
                channel.bindQueue("authentication.responses", "authentication", "authentication.responses");

                // Queues and bindings for the individual SASL mechanisms
                channel.assertQueue("PLAIN", { durable: false });
                channel.bindQueue("PLAIN", "authentication", "authentication.PLAIN");
                channel.assertQueue("EXTERNAL", { durable: false });
                channel.bindQueue("EXTERNAL", "authentication", "authentication.EXTERNAL");
                channel.assertQueue("ANONYMOUS", { durable: false });
                channel.bindQueue("ANONYMOUS", "authentication", "authentication.ANONYMOUS");

                channel.assertQueue("authorization", { durable: false });
                channel.assertQueue("smtp.verify", { durable: false });
                channel.assertQueue("smtp.expand", { durable: false });

                channel.consume("authentication.responses", (message : ConsumeMessage | null) => {
                    if (!message) return;
                    this.responseEmitter.emit(message.properties.correlationId, message);
                }, { noAck: true });
            });
        });
    }

    public acceptInboundEmail (message : EmailMessage) : void {
        this.channel.publish("accepted.inbound.email", "after.smtp", Buffer.from(JSON.stringify(message)));
    }

    public acceptOutboundEmail (message : EmailMessage) : void {
        this.channel.publish("accepted.outbound.email", "after.smtp", Buffer.from(JSON.stringify(message)));
    }

    public rejectInboundEmail (message : EmailMessage) : void {
        this.channel.publish("rejected.inbound.email", "after.smtp", Buffer.from(JSON.stringify(message)));
    }

    public rejectOutboundEmail (message : EmailMessage) : void {
        this.channel.publish("rejected.outbound.email", "after.smtp", Buffer.from(JSON.stringify(message)));
    }

    public publishEvent (topic : string, message : object) : void {
        this.channel.publish("events", topic, Buffer.from(JSON.stringify(message)));
    }

    // TODO: Return authenticated attributes and assign them to the connection.
    public checkAuthentication (saslMechanism : string, message : UniquelyIdentified) : Promise<boolean> {
        this.channel.publish(
            "authentication",
            ("authentication." + saslMechanism),
            Buffer.from(JSON.stringify(message)),
            {
                correlationId: message.id,
                content_type: "application/json",
                content_encoding: "8bit",
                expiration: 10000, // TODO: Make this a configurable expiration.
                replyTo: "authentication.responses"
            });

        // This induces a timeout, so that we do not accumulate event listeners
        // if the authenticator misses some authentication requests.
        setTimeout(() => {
            this.responseEmitter.emit(message.id, null);
        }, 10000); // TODO: Change this to a configurable timeout.

        return new Promise<boolean>((resolve, reject) => {
            // I got this idea from here: https://github.com/AlariCode/rabbitmq-rpc/blob/master/lib/index.ts
            this.responseEmitter.once(message.id, (response : Message | null) => {
                if (!response) {
                    reject("Authentication attempt timed out.");
                    return;
                }
                if (response.toString()) resolve(JSON.parse(response.toString()));
                else reject(new Error("Could not convert message to string."));
            });
        });
    }

    // TODO: Send EmailMessage and return { authorized, code, reason, etc. }
    public checkAuthorization (message : object) : boolean {
        return true;
    }

    // TODO:
    public verify (user : string) : object[] {
        return [];
    }

    // TODO:
    public expand (list : string) : object[] {
        return [];
    }

    public close () : void {
        this.channel.close();
        this.connection.close();
    }

}
import ConfigurationSource from "../ConfigurationSource";
import EmailMessage from "../EmailMessage";
import MessageBroker from "../MessageBroker";
const amqp = require("amqplib/callback_api");
const uuidv4 : () => string = require("uuid/v4");

export default
class AMQPMessageBroker implements MessageBroker {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();

    private readonly server_host! : string;
    private readonly server_port! : number;
    private connection! : any;
    private channel! : any;

    constructor (
        readonly configuration : ConfigurationSource
    ) {
        this.server_host = configuration.queue_server_hostname;
        this.server_port = configuration.queue_server_tcp_listening_port;
        amqp.connect(`amqp://${this.server_host}:${this.server_port}`, (err : Error, connection : any) => {
            if (err) { console.log(err); return; }
            this.connection = connection;

            connection.createChannel((err : Error, channel : any) => {
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

                // These will use RPC
                channel.assertQueue("authentication", { durable: false });
                channel.assertQueue("authorization", { durable: false });
                channel.assertQueue("smtp.verify", { durable: false });
                channel.assertQueue("smtp.expand", { durable: false });
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
    
    // These use RPC

    // TODO: Return authenticated attributes and assign them to the connection.
    public checkAuthentication (message : object) : boolean {
        return true;
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
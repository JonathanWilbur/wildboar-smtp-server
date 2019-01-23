import ConfigurationSource from "../ConfigurationSource";
import Email from "../Email";
import MessageBroker from "../MessageBroker";
const amqp = require("amqplib/callback_api");

export default
class AMQPMessageBroker implements MessageBroker {

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
                channel.assertExchange("email.messages", "direct", { durable: true});
                channel.assertQueue("after.smtp", { durable: true });
                channel.assertQueue("event", { durable: false });
                channel.assertQueue("authn", { durable: false });
                channel.assertQueue("authz", { durable: false });
                channel.bindQueue("after.smtp", "email.messages", "smtp");
                this.channel = channel;
            });
        });
    }

    public publishEmail (email : Email) : void {
        this.channel.publish("email.messages", "after.smtp", JSON.stringify(email));
    }

}
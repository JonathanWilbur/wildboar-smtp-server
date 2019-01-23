import * as net from "net";
import AMQPMessageBroker from "./MessageBrokers/AMQP";
import ConfigurationSource from "./ConfigurationSource";
import Connection from "./Connection";
import MessageBroker from "./MessageBroker";
import TypedKeyValueStore from "./ConfigurationSource";

export default
class Server {

    private messageBroker! : MessageBroker;

    constructor(
        readonly configuration : TypedKeyValueStore & ConfigurationSource,
    ) {
        this.messageBroker = new AMQPMessageBroker(configuration);
        net.createServer((socket : net.Socket) : void => {
            const connection : Connection = new Connection(this, socket);
        }).listen(
            this.configuration.smtp_server_tcp_listening_port,
            this.configuration.smtp_server_ip_bind_address,
            () : void => { console.log("Listening for connections..."); }
        );
    }

}
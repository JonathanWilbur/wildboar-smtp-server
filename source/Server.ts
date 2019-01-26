import * as net from "net";
import AMQPMessageBroker from "./MessageBrokers/AMQP";
import ConfigurationSource from "./ConfigurationSource";
import Connection from "./Connection";
import MessageBroker from "./MessageBroker";
import Temporal from "./Temporal";
import TypedKeyValueStore from "./ConfigurationSource";
import UniquelyIdentified from "./UniquelyIdentified";
const uuidv4 : () => string = require("uuid/v4");

export default
class Server implements UniquelyIdentified {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();
    public messageBroker! : MessageBroker;

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

        process.on('SIGINT', () : void => {
            console.log("Interrupted. Shutting down.");
            this.messageBroker.close();
            process.exit();
        });
    }

}
import * as net from "net";
import Connection from "./Connection";
import TypedKeyValueStore from "./ConfigurationSource";

export default
class Server {

    constructor(
        readonly configuration : TypedKeyValueStore
    ) {
        net.createServer((socket : net.Socket) : void => {
            const connection : Connection = new Connection(this, socket);
        }).listen(
            this.configuration.smtp_server_tcp_listening_port,
            this.configuration.smtp_server_ip_bind_address,
            () : void => { console.log("Listening for connections..."); }
        );
    }

}
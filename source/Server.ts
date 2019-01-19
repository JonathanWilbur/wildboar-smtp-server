import * as net from "net";
import Connection from "./Connection";
import ServerOptions from "./ServerOptions";

export default
class Server {

    constructor(
        readonly listeningHost : string,
        readonly listeningPort : number,
        readonly options? : ServerOptions
    ) {

        net.createServer((socket : net.Socket) : void => {
            const connection : Connection = new Connection(socket);
        }).listen(this.listeningPort, this.listeningHost, () : void => {
            console.log("Listening for connections...");
        });
    }

}
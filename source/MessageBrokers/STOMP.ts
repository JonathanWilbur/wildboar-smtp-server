// This has been commented out because I am no longer using STOMP. I would
// still prefer to keep it here, because figuring this out was awful.
// If you want to re-enable STOMP, uncomment the code below.
//
// You will also need to run 'npm install --save ws @stomp/stompjs'

// import * as stomp from "@stomp/stompjs";
// // const shim = require("./shim");
// // shim();

// export default
// class STOMPMessageBroker {
//     constructor () {
//         // const queueingHost : string = "messagebroker";
//         const queueingHost : string = "localhost";
//         // const queueingPort : number = 5672; // This is the default AQMP port for RabbitMQ.
//         // const queueingPort : number = 15674; // This is the default STOMP port for RabbitMQ.
//         const queueingPort : number = 61613; // ... yet STOMP is somehow listening on this port.
//         const client : stomp.Client = new stomp.Client({
//             brokerURL: `ws://${queueingHost}:${queueingPort}`,
//             debug: (message : string) => { console.log(message); },
//             connectHeaders: {
//                 login: "guest",
//                 passcode: "guest"
//             },
//             reconnectDelay: 5000,
//             heartbeatIncoming: 4000,
//             heartbeatOutgoing: 4000,
//             logRawCommunication: true,
//             forceBinaryWSFrames: true,
//             webSocketFactory: () : WebSocket => {
//                 const ws : WebSocket = new WebSocket(`ws://${queueingHost}:${queueingPort}`);
//                 ws.onopen = () => { console.log("WS OPEN") }
//                 ws.onclose = () => { console.log("WS CLOSE") }
//                 ws.onmessage = () => { console.log("WS MESSAGE") }
//                 ws.onerror = () => { console.log("WS ERROR") }
//                 console.log(`WS PROTOCOL: ${ws.protocol}`);
//                 // ws.send(new Uint8Array([ 0, 5, 4, 3]));
//                 return ws;
//             }
//         });
//         client.onConnect = (frame : stomp.Frame) => {
//             client.publish({
//                 body: "Did you get this?",
//                 destination: "/smtp/message"
//             });
//         };
//         client.activate();
//     }
// }
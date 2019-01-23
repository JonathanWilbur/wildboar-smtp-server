// This has been commented out because I am no longer using STOMP. I would
// still prefer to keep it here, because figuring this out was awful.
// If you want to re-enable STOMP, uncomment the code below, and add this
// to the top of index.ts:
// const shim = require("./shim");
// shim();
//
// You will also need to run 'npm install --save ws @stomp/stompjs'

/**
 * I had to do this to make WebSocket a global symbol, which is required for
 * StompJS to work. It is not very clearly documented, unfortunately. This
 * exported function is ran at the very start-up of the server in index.ts.
 */
// module.exports = function () {
//     global.WebSocket = require("ws");
//     // global.WebSocket = require('websocket').w3cwebsocket;
// }
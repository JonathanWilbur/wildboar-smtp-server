"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Connection {
    constructor(socket) {
        this.socket = socket;
        this.readCursor = 0;
        this.receivedData = new Buffer(0);
        this.clientSaidHello = false;
        this.clientEstimatedMessageSize = 0;
        this.transaction = {
            from: "",
            to: [],
            data: new Buffer(0)
        };
        this.respond(220, "testeroni Service ready");
        socket.on("data", (data) => {
            this.receivedData = Buffer.concat([this.receivedData, data]);
            let parsedCommand = undefined;
            for (let i = this.readCursor; i < this.receivedData.length; i++) {
                if (this.receivedData[i] === " ".charCodeAt(0) &&
                    i !== this.readCursor) {
                    parsedCommand = this.receivedData.slice(this.readCursor, i).toString("ascii");
                    break;
                }
            }
            if (typeof parsedCommand === "undefined") {
                console.log("Parsed command was undefined.");
                return;
            }
            parsedCommand = parsedCommand.toUpperCase();
            const indexOfEndOfCommand = this.findEndOfCommand(parsedCommand);
            if (indexOfEndOfCommand === -1)
                return;
            const args = this.receivedData.slice((this.readCursor + parsedCommand.length + " ".length), indexOfEndOfCommand);
            this.dispatchCommand(parsedCommand, args);
            this.readCursor = indexOfEndOfCommand;
            if (parsedCommand in Connection.commandTerminators)
                this.readCursor += Connection.commandTerminators[parsedCommand].length;
        });
        socket.on("close", (had_error) => {
            console.log(`Connection closed. Had error? ${had_error}.`);
        });
    }
    resetTransaction() {
        this.transaction = {
            from: "",
            to: [],
            data: new Buffer(0)
        };
    }
    respond(code, message) {
        this.socket.write(`${code} ${message}\r\n`);
    }
    findEndOfCommand(command) {
        switch (command) {
            case ("HELO"):
            case ("EHLO"):
            case ("MAIL"):
            case ("RCPT"):
            case ("RSET"):
            case ("VRFY"):
            case ("EXPN"):
            case ("HELP"):
            case ("NOOP"):
            case ("QUIT"):
                return this.receivedData.indexOf("\r\n", (this.readCursor + command.length));
            case ("DATA"):
                return this.receivedData.indexOf("\r\n.\r\n", (this.readCursor + command.length));
            default: {
                this.respond(500, `Command '${command}' not recognized.`);
                return -1;
            }
        }
    }
    dispatchCommand(command, args) {
        switch (command) {
            case ("HELO"):
                this.executeHELO(args);
                break;
            case ("EHLO"):
                this.executeEHLO(args);
                break;
            case ("MAIL"):
                this.executeMAIL(args);
                break;
            case ("RCPT"):
                this.executeRCPT(args);
                break;
            default: {
                this.respond(504, `Command '${command}' not implemented.`);
            }
        }
    }
    executeHELO(args) {
        const lineLength = ("HELO ".length + args.length + "\r\n".length);
        if (lineLength > 512) {
            this.respond(500, `Command line too long. Must not exceed 512 characters. Yours was ${lineLength} characters long.`);
            return;
        }
        this.clientSaidHello = true;
        this.resetTransaction();
        this.respond(250, `testeroni`);
    }
    executeEHLO(args) {
        const lineLength = ("EHLO ".length + args.length + "\r\n".length);
        if (lineLength > 512) {
            this.respond(500, `Command line too long. Must not exceed 512 characters. Yours was ${lineLength} characters long.`);
            return;
        }
        this.clientSaidHello = true;
        this.resetTransaction();
        this.respond(250, `testeroni`);
    }
    executeMAIL(args) {
        const lineLength = ("MAIL ".length + args.length + "\r\n".length);
        if (lineLength > 512) {
            this.respond(500, `Command line too long. Must not exceed 512 characters. Yours was ${lineLength} characters long.`);
            return;
        }
        if (!this.clientSaidHello) {
            this.respond(503, "Must use HELO or EHLO command before MAIL command.");
            return;
        }
        const indexOfStartOfEmail = args.toString().indexOf("FROM:<");
        const indexOfClosingBracket = args.toString().indexOf(">");
        if (indexOfStartOfEmail !== -1 &&
            indexOfClosingBracket !== -1) {
            this.transaction.from = "";
            this.transaction.to = [];
            this.transaction.data = new Buffer(0);
            this.transaction.from = args.toString().slice("FROM:<".length, indexOfClosingBracket);
            this.respond(250, "MAIL OK");
        }
        else {
            this.respond(500, "Malformed MAIL command.");
        }
    }
    executeRCPT(args) {
        const lineLength = ("RCPT ".length + args.length + "\r\n".length);
        if (lineLength > 512) {
            this.respond(500, `Command line too long. Must not exceed 512 characters. Yours was ${lineLength} characters long.`);
            return;
        }
        if (!this.clientSaidHello) {
            this.respond(503, "Must use HELO or EHLO command before RCPT command.");
            return;
        }
        const indexOfStartOfEmail = args.toString().indexOf("TO:<");
        const indexOfClosingBracket = args.toString().indexOf(">");
        if (indexOfStartOfEmail !== -1 &&
            indexOfClosingBracket !== -1) {
            const matches = /^<(?<sourceRoutes>[^:]+:)(?<destination>[^>]+)>/g.exec(args.toString());
            if (!matches) {
                this.respond(500, "Malformed RCPT command.");
                return;
            }
            if (!matches.groups) {
                this.respond(554, "Server failure when trying to dissect RCPT TO argument.");
                return;
            }
            this.transaction.to.push({
                sourceRoutes: matches.groups.sourceRoutes.split(","),
                destinationMailbox: matches.groups.destination
            });
            this.respond(250, "RCPT OK");
        }
        else {
            this.respond(500, "Malformed RCPT Command.");
        }
    }
}
Connection.commandTerminators = {
    "HELO": Buffer.from("\r\n"),
    "EHLO": Buffer.from("\r\n"),
    "MAIL": Buffer.from("\r\n"),
    "RCPT": Buffer.from("\r\n"),
    "DATA": Buffer.from("\r\n.\r\n"),
    "RSET": Buffer.from("\r\n"),
    "VRFY": Buffer.from("\r\n"),
    "EXPN": Buffer.from("\r\n"),
    "HELP": Buffer.from("\r\n"),
    "NOOP": Buffer.from("\r\n"),
    "QUIT": Buffer.from("\r\n")
};
exports.default = Connection;
//# sourceMappingURL=Connection.js.map
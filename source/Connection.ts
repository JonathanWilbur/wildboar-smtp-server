import * as net from "net";
import Transaction from "./Transaction";

export default
class Connection {

    private readCursor : number = 0;
    private receivedData : Buffer = new Buffer(0);

    // RFC 5321 Section 4.1.4:
    // A session that will contain mail transactions MUST first be
    // initialized by the use of the EHLO command.  An SMTP server SHOULD
    // accept commands for non-mail transactions (e.g., VRFY or EXPN)
    // without this initialization.
    private clientSaidHello : boolean = false;
    private clientEstimatedMessageSize : number = 0;
    private transaction : Transaction = {
        from: "",
        to: [],
        data: new Buffer(0)
    };

    private static readonly commandTerminators : { [ name : string ] : Buffer } = {
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
    }

    constructor (readonly socket : net.Socket) {

        // TODO: Return 554 if connection rejected.
        this.respond(220, "testeroni Service ready");

        // Rules: only increment readCursor after a command has been fully processed.
        socket.on("data", (data : Buffer) : void => {

            // TODO: Periodically clear the buffer, somehow.
            // Append new data to the buffer.
            this.receivedData = Buffer.concat([ this.receivedData, data ]);

            let parsedCommand : string | undefined = undefined;

            for (let i : number = this.readCursor; i < this.receivedData.length; i++) {
                if (
                    this.receivedData[i] === " ".charCodeAt(0) &&
                    i !== this.readCursor
                ) {
                    // REVIEW: Can this throw?
                    parsedCommand = this.receivedData.slice(this.readCursor, i).toString("ascii");
                    break;
                }
            }

            if (typeof parsedCommand === "undefined") {
                console.log("Parsed command was undefined.");
                return;
            }
            // TODO: Validate command here.
            parsedCommand = parsedCommand.toUpperCase(); // TODO: Quote spec about case insensitivity.
            const indexOfEndOfCommand : number = this.findEndOfCommand(parsedCommand);
            if (indexOfEndOfCommand === -1) return;
            const args : Buffer =  this.receivedData.slice((this.readCursor + parsedCommand.length + " ".length), indexOfEndOfCommand);
            this.dispatchCommand(parsedCommand, args);
            this.readCursor = indexOfEndOfCommand;
            if (parsedCommand in Connection.commandTerminators)
                this.readCursor += Connection.commandTerminators[parsedCommand].length;
        });

        socket.on("close", (had_error : boolean) : void => {
            console.log(`Connection closed. Had error? ${had_error}.`);
        });
    }

    private resetTransaction () : void {
        this.transaction = {
            from: "",
            to: [],
            data: new Buffer(0)
        }
    }

    private respond (code : number, message : string) : void {
        this.socket.write(`${code} ${message}\r\n`);
    }

    // This method exists because not all commands are terminated by CRLF.
    // Returns -1 if end not found.
    private findEndOfCommand (command : string) : number {
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

    // "It is important that you do not use a callback map, because the map
    // itself will become 'this' in the callbacks." -- Hard experience.
    private dispatchCommand (command : string, args : Buffer) : void {
        switch (command) {
            case ("HELO"): this.executeHELO(args); break;
            case ("EHLO"): this.executeEHLO(args); break;
            case ("MAIL"): this.executeMAIL(args); break;
            case ("RCPT"): this.executeRCPT(args); break;
            default: {
                this.respond(504, `Command '${command}' not implemented.`);
            }
        }
    }

    // Individual command handlers go below here.

    // TODO: Return 504, 550
    private executeHELO (args : Buffer) : void {
        const lineLength : number = ("HELO ".length + args.length + "\r\n".length);
        if (lineLength > 512) {
            this.respond(500, `Command line too long. Must not exceed 512 characters. Yours was ${lineLength} characters long.`);
            return;
        }

        // RFC 5321 Section 4.1.4:
        // A session that will contain mail transactions MUST first be
        // initialized by the use of the EHLO command.  An SMTP server SHOULD
        // accept commands for non-mail transactions (e.g., VRFY or EXPN)
        // without this initialization.
        this.clientSaidHello = true;

        // From RFC 5321 Section 4.1.4:
        // If it is issued after the session begins and the EHLO command is
        // acceptable to the SMTP server, the SMTP server MUST clear all buffers
        // and reset the state exactly as if a RSET command had been issued.
        this.resetTransaction();

        // TODO: Replace with a real server name.
        this.respond(250, `testeroni`);
    }

    // TODO: Return 504, 550
    private executeEHLO (args : Buffer) : void {
        const lineLength : number = ("EHLO ".length + args.length + "\r\n".length);
        if (lineLength > 512) {
            this.respond(500, `Command line too long. Must not exceed 512 characters. Yours was ${lineLength} characters long.`);
            return;
        }

        // RFC 5321 Section 4.1.4:
        // A session that will contain mail transactions MUST first be
        // initialized by the use of the EHLO command.  An SMTP server SHOULD
        // accept commands for non-mail transactions (e.g., VRFY or EXPN)
        // without this initialization.
        this.clientSaidHello = true;

        // From RFC 5321 Section 4.1.4:
        // If it is issued after the session begins and the EHLO command is
        // acceptable to the SMTP server, the SMTP server MUST clear all buffers
        // and reset the state exactly as if a RSET command had been issued.
        this.resetTransaction();

        // TODO: Replace with a real server name.
        this.respond(250, `testeroni`);
    }

    // TODO: Return 552, 451, 452, 550, 553, 503, 455, 555
    private executeMAIL (args : Buffer) : void {
        const lineLength : number = ("MAIL ".length + args.length + "\r\n".length);
        if (lineLength > 512) {
            this.respond(500, `Command line too long. Must not exceed 512 characters. Yours was ${lineLength} characters long.`);
            return;
        }

        // RFC 5321 Section 4.1.4:
        // A session that will contain mail transactions MUST first be
        // initialized by the use of the EHLO command.  An SMTP server SHOULD
        // accept commands for non-mail transactions (e.g., VRFY or EXPN)
        // without this initialization.
        if (!this.clientSaidHello) {
            this.respond(503, "Must use HELO or EHLO command before MAIL command.");
            return;
        }

        const indexOfStartOfEmail : number = args.toString().indexOf("FROM:<");
        const indexOfClosingBracket : number = args.toString().indexOf(">");
        if (
            indexOfStartOfEmail   !== -1 &&
            indexOfClosingBracket !== -1
        ) {
            // RFC 5321 S 4.1.1.2:
            // This command clears the reverse-path buffer, the forward-path buffer,
            // and the mail data buffer, and it inserts the reverse-path information
            // from its argument clause into the reverse-path buffer.
            this.transaction.from = "";
            this.transaction.to = [];
            this.transaction.data = new Buffer(0);
            this.transaction.from = args.toString().slice("FROM:<".length, indexOfClosingBracket);
            // TODO: Validate FROM
            // TODO: Support the SIZE parameter.
            this.respond(250, "MAIL OK");
        } else {
            this.respond(500, "Malformed MAIL command.");
        }
    }

    private executeRCPT (args : Buffer) : void {
        const lineLength : number = ("RCPT ".length + args.length + "\r\n".length);
        if (lineLength > 512) {
            this.respond(500, `Command line too long. Must not exceed 512 characters. Yours was ${lineLength} characters long.`);
            return;
        }

        // RFC 5321 Section 4.1.4:
        // A session that will contain mail transactions MUST first be
        // initialized by the use of the EHLO command.  An SMTP server SHOULD
        // accept commands for non-mail transactions (e.g., VRFY or EXPN)
        // without this initialization.
        if (!this.clientSaidHello) {
            this.respond(503, "Must use HELO or EHLO command before RCPT command.");
            return;
        }

        const indexOfStartOfEmail : number = args.toString().indexOf("TO:<");
        const indexOfClosingBracket : number = args.toString().indexOf(">");
        if (
            indexOfStartOfEmail   !== -1 &&
            indexOfClosingBracket !== -1
        ) {
            // From RFC 5321, Section 4.1.1.3:
            // This command appends its forward-path argument to the forward-path
            // buffer; it does not change the reverse-path buffer nor the mail data
            // buffer.
            // this.transaction.from = args.toString().slice("TO:<".length, indexOfClosingBracket);
            const matches : RegExpExecArray | null = /^<(?<sourceRoutes>[^:]+:)(?<destination>[^>]+)>/g.exec(args.toString());
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
        } else {
            this.respond(500, "Malformed RCPT Command.");
        }
    }
}
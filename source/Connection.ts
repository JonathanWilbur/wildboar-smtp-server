import { ParsedMailbox as EmailAddress, parseOneAddress } from "email-addresses";
import * as net from "net";
import Lexeme from "./Lexeme";
import LexemeType from "./LexemeType";
import Scanner from "./Scanner";
import Transaction from "./Transaction";
import Server from "./Server";
import Recipient from "./Recipient";
import Email from "./Email";
import EmailMessage from "./EmailMessage";
import Temporal from "./Temporal";
import UniquelyIdentified from "./UniquelyIdentified";
const uuidv4 : () => string = require("uuid/v4");
const replaceBuffer = require("replace-buffer");

export default
class Connection implements Temporal, UniquelyIdentified {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();
    
    private scanner = new Scanner(this.socket);
    // RFC 5321 Section 4.1.4:
    // A session that will contain mail transactions MUST first be
    // initialized by the use of the EHLO command.  An SMTP server SHOULD
    // accept commands for non-mail transactions (e.g., VRFY or EXPN)
    // without this initialization.
    private clientSaidHello : boolean = false;
    private clientEstimatedMessageSize : number = 0; // Will be used by the SIZE parameter
    private expectedLexemeType : LexemeType = LexemeType.COMMANDLINE;
    private transaction! : Transaction;

    constructor (
        readonly server : Server,
        readonly socket : net.Socket
    ) {
        this.resetTransaction();

        // TODO: Return 554 if connection rejected.
        this.respond(220, this.server.configuration.smtp_server_greeting);
        socket.on("data", (data : Buffer) : void => {
            this.scanner.enqueueData(data);
            let lexeme : Lexeme | null = null;
            while (true) {
                switch (this.expectedLexemeType) {
                    case (LexemeType.COMMANDLINE):  lexeme = this.scanner.scanLine();  break;
                    case (LexemeType.DATA):         lexeme = this.scanner.scanData();  break;
                    case (LexemeType.CHUNK):        lexeme = this.scanner.scanChunk(); break;
                    // TODO: Default
                }
                if (!lexeme) break;
                if (lexeme.type === LexemeType.COMMANDLINE) {
                    const command : string = lexeme.getCommand();
                    const args : string = lexeme.getArguments();
                    this.dispatchCommand(command, args);
                } else if (lexeme.type === LexemeType.DATA) {
                    this.expectedLexemeType = LexemeType.COMMANDLINE;
                    const data : Buffer = Buffer.from(lexeme.token); // So lexeme.token is not modified by reference.

                    // See RFC 5321, Section 4.5.2.
                    this.transaction.data = replaceBuffer(data, "\r\n.", "\r\n");

                    // RFC 5321, Section 4.1.1.4:
                    // Receipt of the end of mail data indication requires the server to
                    // process the stored mail transaction information.
                    this.processTransaction();
                    this.respond(250, "DATA OK");
                }
            };
        });

        socket.on("close", (had_error : boolean) : void => {
            console.log(`Bye!`);
        });
    }

    private respond (code : number, message : string) : void {
        this.socket.write(`${code} ${message}\r\n`);
    }

    private respondMultiline (code : number, lines : string[]) : void {
        if (lines.length === 0) return;
        this.socket.write(`${lines.map((line : string)=> `${code}-${line}`).join("\r\n")}`);
    }

    private resetTransaction () : void {
        this.transaction = {
            id: `urn:uuid:${uuidv4()}`,
            creationTime: new Date(),
            from: "",
            to: [],
            data: Buffer.alloc(0)
        }
    }

    // "It is important that you do not use a callback map, because the map
    // itself will become 'this' in the callbacks." -- Hard experience.
    private dispatchCommand (command : string, args : string) : void {
        console.log(`Dispatching '${command}'.`);
        switch (command) {
            case ("HELO"): this.executeHELO(args); break;
            case ("EHLO"): this.executeEHLO(args); break;
            case ("MAIL"): this.executeMAIL(args); break;
            case ("RCPT"): this.executeRCPT(args); break;
            case ("DATA"): this.executeDATA(args); break;
            case ("RSET"): this.executeRSET(args); break;
            case ("VRFY"): this.executeVRFY(args); break;
            case ("EXPN"): this.executeEXPN(args); break;
            case ("HELP"): this.executeHELP(args); break;
            case ("NOOP"): this.executeNOOP(args); break;
            case ("QUIT"): this.executeQUIT(args); break;
            default: {
                this.respond(504, `Command '${command}' not implemented.`);
            }
        }
    }

    // Individual command handlers go below here.

    // TODO: Return 504, 550
    private executeHELO (args : string) : void {

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

        this.respond(250, this.server.configuration.smtp_server_domain);
    }

    // TODO: Return 504, 550
    private executeEHLO (args : string) : void {

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

        this.respond(250, this.server.configuration.smtp_server_domain);
    }

    // TODO: Return 552, 451, 452, 550, 553, 503, 455, 555
    private executeMAIL (args : string) : void {

        // RFC 5321 Section 4.1.4:
        // A session that will contain mail transactions MUST first be
        // initialized by the use of the EHLO command.  An SMTP server SHOULD
        // accept commands for non-mail transactions (e.g., VRFY or EXPN)
        // without this initialization.
        if (!this.clientSaidHello) {
            this.respond(503, "Must use HELO or EHLO command before MAIL command.");
            return;
        }

        if (args === "") {
            this.respond(501, "The MAIL command requires arguments, which you did not supply.");
            return;
        }

        const indexOfStartOfEmail : number = args.indexOf("FROM:<");
        const indexOfClosingBracket : number = args.indexOf(">");
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
            this.transaction.data = Buffer.alloc(0);
            this.transaction.from = args.slice("FROM:<".length, indexOfClosingBracket);
            // TODO: Validate FROM
            // TODO: Support the SIZE parameter.
            this.respond(250, "MAIL OK");
        } else {
            this.respond(500, "Malformed MAIL command.");
        }
    }

    private executeRCPT (args : string) : void {

        // RFC 5321 Section 4.1.4:
        // A session that will contain mail transactions MUST first be
        // initialized by the use of the EHLO command.  An SMTP server SHOULD
        // accept commands for non-mail transactions (e.g., VRFY or EXPN)
        // without this initialization.
        if (!this.clientSaidHello) {
            this.respond(503, "Must use HELO or EHLO command before RCPT command.");
            return;
        }

        if (args === "") {
            this.respond(501, "The RCPT command requires arguments, which you did not supply.");
            return;
        }

        const indexOfStartOfEmail : number = args.indexOf("TO:<");
        const indexOfClosingBracket : number = args.indexOf(">");
        if (
            indexOfStartOfEmail   !== -1 &&
            indexOfClosingBracket !== -1
        ) {
            // From RFC 5321, Section 4.1.1.3:
            // This command appends its forward-path argument to the forward-path
            // buffer; it does not change the reverse-path buffer nor the mail data
            // buffer.
            const matches : RegExpExecArray | null = /^TO:<(?:(?<sourceRoutes>[^:]+):)?(?<destination>[^>]+)>/.exec(args);
            if (!matches) {
                this.respond(500, "Malformed RCPT command.");
                return;
            }
            if (!matches.groups) {
                this.respond(554, "Server failure when trying to dissect RCPT TO argument.");
                return;
            }
            this.transaction.to.push({
                sourceRoutes: (matches.groups.sourceRoutes !== undefined ? matches.groups.sourceRoutes.split(",") : []),
                destinationMailbox: matches.groups.destination
            });
            this.respond(250, "RCPT OK");
        } else {
            this.respond(500, "Malformed RCPT Command.");
        }
    }

    private executeDATA (args : string) : void {
        this.expectedLexemeType = LexemeType.DATA;
        this.respond(354, "Go ahead.");
    }

    private executeRSET (args : string) : void {
        if (args.length === 0) {
            this.resetTransaction();
            this.respond(250, "RSET OK");
        } else {
            this.respond(501, "RSET does not accept any parameters.");
        }
    }

    // TODO: This warrants a verification queue in RabbitMQ
    private executeVRFY (args : string) : void {
        // getMatchingUsers(args)
        // if multiple, respond 553 and a list of users or "User ambiguous"
        // Respond 550 if it is a mailing list, not a user.
        // Respond 252 if unable to verify members of mailing list.
        this.respond(250, "VRFY OK");
        // This is only here for test purposes, obviously.
        this.respondMultiline(250, [
            "User ambiguous; possible matches: ",
            "Jonathan M. Wilbur <jonathan@wilbur.space>",
            "Sam Hyde <sam@mde.com>"
        ]);
    }

    private executeEXPN (args : string) : void {
        // Respond 550 if it is a username, not a mailing list.
        // Respond 252 if mailing list does not exist.
        this.respond(250, "EXPN OK");
        // This is only here for test purposes, obviously.
        this.respondMultiline(250, [ "Jonathan M. Wilbur <jonathan@wilbur.space>", "Sam Hyde <sam@mde.com>" ]);
    }

    // TODO: Implement a custom help message. Separate ones for authenticated and non-authenticated.
    private executeHELP (args : string) : void {
        this.respond(502, "Go help yourself.");
    }

    private executeNOOP (args : string) : void {
        this.respond(250, "NOOP OK");
    }

    private executeQUIT (args : string) : void {
        this.respond(250, "Bye.");
        this.socket.end();
    }

    // TODO: The creationTime fields MUST be encoded as ISO 8601 strings
    private processTransaction () : void {
        this.transaction.to.forEach((recipient : Recipient) : void => {
            const message : EmailMessage = {
                server : {
                    id: this.server.id,
                    creationTime: this.server.creationTime
                },
                connection: {
                    id: this.id,
                    creationTime: this.creationTime,
                    remote: {
                        family: this.socket.remoteFamily,
                        address: this.socket.remoteAddress,
                        port: this.socket.remotePort
                    },
                    local: {
                        address: this.socket.localAddress,
                        port: this.socket.localPort
                    },
                    bufferSize: this.socket.bufferSize,
                    bytesRead: this.socket.bytesRead,
                    bytesWritten: this.socket.bytesWritten
                },
                messageBroker: {
                    id: this.server.messageBroker.id
                },
                configuration: {
                    id: this.server.configuration.id
                },
                transaction: {
                    id: this.transaction.id,
                    creationTime: this.transaction.creationTime
                },
                email : new Email(
                    this.transaction.from,
                    this.transaction.to.map((recipient : Recipient) => recipient.destinationMailbox),
                    "",
                    this.transaction.data.toString()
                )
            };

            if (recipient.destinationMailbox.endsWith(`@${this.server.configuration.smtp_server_domain}`)) {
                this.server.messageBroker.acceptInboundEmail(message);
            } else {
                this.server.messageBroker.acceptOutboundEmail(message);
            }
        });
        this.resetTransaction();
    }
}
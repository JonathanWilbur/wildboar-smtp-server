"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Scanner_1 = require("./Scanner");
const Email_1 = require("./Email");
const uuidv4 = require("uuid/v4");
class Connection {
    constructor(server, socket) {
        this.server = server;
        this.socket = socket;
        this.id = `urn:uuid:${uuidv4()}`;
        this.creationTime = new Date();
        this.scanner = new Scanner_1.default(this.socket);
        this.clientSaidHello = false;
        this.clientEstimatedMessageSize = 0;
        this.expectedLexemeType = 0;
        this.resetTransaction();
        this.respond(220, this.server.configuration.smtp_server_greeting);
        socket.on("data", (data) => {
            this.scanner.enqueueData(data);
            let lexeme = null;
            while (true) {
                switch (this.expectedLexemeType) {
                    case (0):
                        lexeme = this.scanner.scanLine();
                        break;
                    case (1):
                        lexeme = this.scanner.scanData();
                        break;
                    case (2):
                        lexeme = this.scanner.scanChunk();
                        break;
                }
                if (!lexeme)
                    break;
                if (lexeme.type === 0) {
                    const command = lexeme.getCommand();
                    const args = lexeme.getArguments();
                    this.dispatchCommand(command, args);
                }
                else if (lexeme.type === 1) {
                    this.expectedLexemeType = 0;
                    this.transaction.data = lexeme.token;
                    this.processTransaction();
                    this.respond(250, "DATA OK");
                }
            }
            ;
        });
        socket.on("close", (had_error) => {
            console.log(`Bye!`);
        });
    }
    respond(code, message) {
        this.socket.write(`${code} ${message}\r\n`);
    }
    respondMultiline(code, lines) {
        if (lines.length === 0)
            return;
        this.socket.write(`${lines.map((line) => `${code}-${line}`).join("\r\n")}`);
    }
    resetTransaction() {
        this.transaction = {
            id: `urn:uuid:${uuidv4()}`,
            creationTime: new Date(),
            from: "",
            to: [],
            data: Buffer.alloc(0)
        };
    }
    dispatchCommand(command, args) {
        console.log(`Dispatching '${command}'.`);
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
            case ("DATA"):
                this.executeDATA(args);
                break;
            case ("RSET"):
                this.executeRSET(args);
                break;
            case ("VRFY"):
                this.executeVRFY(args);
                break;
            case ("EXPN"):
                this.executeEXPN(args);
                break;
            case ("HELP"):
                this.executeHELP(args);
                break;
            case ("NOOP"):
                this.executeNOOP(args);
                break;
            case ("QUIT"):
                this.executeQUIT(args);
                break;
            default: {
                this.respond(504, `Command '${command}' not implemented.`);
            }
        }
    }
    executeHELO(args) {
        this.clientSaidHello = true;
        this.resetTransaction();
        this.respond(250, this.server.configuration.smtp_server_domain);
    }
    executeEHLO(args) {
        this.clientSaidHello = true;
        this.resetTransaction();
        this.respond(250, this.server.configuration.smtp_server_domain);
    }
    executeMAIL(args) {
        if (!this.clientSaidHello) {
            this.respond(503, "Must use HELO or EHLO command before MAIL command.");
            return;
        }
        if (args === "") {
            this.respond(501, "The MAIL command requires arguments, which you did not supply.");
            return;
        }
        const indexOfStartOfEmail = args.indexOf("FROM:<");
        const indexOfClosingBracket = args.indexOf(">");
        if (indexOfStartOfEmail !== -1 &&
            indexOfClosingBracket !== -1) {
            this.transaction.from = "";
            this.transaction.to = [];
            this.transaction.data = Buffer.alloc(0);
            this.transaction.from = args.slice("FROM:<".length, indexOfClosingBracket);
            this.respond(250, "MAIL OK");
        }
        else {
            this.respond(500, "Malformed MAIL command.");
        }
    }
    executeRCPT(args) {
        if (!this.clientSaidHello) {
            this.respond(503, "Must use HELO or EHLO command before RCPT command.");
            return;
        }
        if (args === "") {
            this.respond(501, "The RCPT command requires arguments, which you did not supply.");
            return;
        }
        const indexOfStartOfEmail = args.indexOf("TO:<");
        const indexOfClosingBracket = args.indexOf(">");
        if (indexOfStartOfEmail !== -1 &&
            indexOfClosingBracket !== -1) {
            const matches = /^TO:<(?:(?<sourceRoutes>[^:]+):)?(?<destination>[^>]+)>/.exec(args);
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
        }
        else {
            this.respond(500, "Malformed RCPT Command.");
        }
    }
    executeDATA(args) {
        this.expectedLexemeType = 1;
        this.respond(354, "Go ahead.");
    }
    executeRSET(args) {
        if (args.length === 0) {
            this.resetTransaction();
            this.respond(250, "RSET OK");
        }
        else {
            this.respond(501, "RSET does not accept any parameters.");
        }
    }
    executeVRFY(args) {
        this.respond(250, "VRFY OK");
        this.respondMultiline(250, [
            "User ambiguous; possible matches: ",
            "Jonathan M. Wilbur <jonathan@wilbur.space>",
            "Sam Hyde <sam@mde.com>"
        ]);
    }
    executeEXPN(args) {
        this.respond(250, "EXPN OK");
        this.respondMultiline(250, ["Jonathan M. Wilbur <jonathan@wilbur.space>", "Sam Hyde <sam@mde.com>"]);
    }
    executeHELP(args) {
        this.respond(502, "Go help yourself.");
    }
    executeNOOP(args) {
        this.respond(250, "NOOP OK");
    }
    executeQUIT(args) {
        this.respond(250, "Bye.");
        this.socket.end();
    }
    processTransaction() {
        this.transaction.to.forEach((recipient) => {
            const message = {
                server: {
                    id: this.server.id,
                    creationTime: this.server.creationTime
                },
                connection: {
                    id: this.id,
                    creationTime: this.creationTime
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
                email: new Email_1.default(this.transaction.from, this.transaction.to.map((recipient) => recipient.destinationMailbox), "", this.transaction.data.toString())
            };
            if (recipient.destinationMailbox.endsWith(`@${this.server.configuration.smtp_server_domain}`)) {
                this.server.messageBroker.acceptInboundEmail(message);
            }
            else {
                this.server.messageBroker.acceptOutboundEmail(message);
            }
        });
        this.resetTransaction();
    }
}
exports.default = Connection;
//# sourceMappingURL=Connection.js.map
import * as net from "net";
import Command from "./Command";

enum ScanningState {
    COMMAND,
    SPACE_AFTER_COMMAND,
    ARGUMENTS,
    TERMINATOR,
    MULTILINE,
    MULTILINE_TERMINATOR
}

export default
class Scanner {

    private static readonly MAXIMUM_VERB_LENGTH : number = 32;
    private static readonly MAXIMUM_LINE_LENGTH : number = 512;
    private static readonly LINE_TERMINATOR : string = "\r\n";

    private scanningState : ScanningState = ScanningState.COMMAND;
    private readCursor : number = 0;
    private receivedData : Buffer = Buffer.alloc(0);
    private receivedCommands : Command[] = [];

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

    }

    public scan (bytes : Buffer) : Promise<Command[]> {
        return new Promise<Command[]>((resolve, reject) : void => {

            const commands : Command[] = [];
            // Rules: only increment readCursor after a command has been fully processed.
            // TODO: Periodically clear the buffer, somehow.
            this.receivedData = Buffer.concat([ this.receivedData, bytes ]);

            let currentVerb : string = "";
            let currentArguments : string = "";
            let currentData : Buffer = Buffer.alloc(0);
            let currentTerminator : string = "";

            // Rule: once the terminator is parsed:
            // - Push a new Command to commands, using currentVerb, currentArgument, and currentData.
            // - Set readCursor to i.
            // How to handle DATA:
            // - If DATA is encountered, but no data is sent, resolve a DATA
            //   Command with a null data buffer and the Scanner should move to
            //   DATA scanning state. When Connection detects the null data
            //   buffer, it just sends the 354 response and waits for the data
            //   buffer. Upon scanning a DATA packet with no data, the readCursor
            //   should not be advanced. When the data buffer comes in, the DATA
            //   packet should be resolved again, this time with the included
            //   buffer. This way, whether the client waits for the 354 response,
            //   the same thing happens.
            // How to handle syntactic errors:
            // - Find the index of the next CRLF and zoom ahead there.
            // - Respond with the bad syntax.
            let i : number = 0;
            while ((this.readCursor + i) < this.receivedData.length) {

                // See: https://stackoverflow.com/questions/27747437/typescript-enum-switch-not-working
                switch (+this.scanningState) {
                    case (ScanningState.COMMAND): {
                        if (currentVerb.length >= Scanner.MAXIMUM_VERB_LENGTH) {
                            this.respond(500, `Command verb too long. Cannot exceed ${Scanner.MAXIMUM_VERB_LENGTH} characters.`);
                            reject();
                        }
                        if (Scanner.isAlphabeticCharacter(this.receivedData[(this.readCursor + i)])) {
                            currentVerb += String.fromCharCode(this.receivedData[(this.readCursor + i)]);
                        } else {
                            this.scanningState = ScanningState.SPACE_AFTER_COMMAND;
                        }
                        break;
                    }
                    case (ScanningState.SPACE_AFTER_COMMAND): {
                        if (this.receivedData[(this.readCursor + i)] === " ".charCodeAt(0)) {
                            this.scanningState = ScanningState.ARGUMENTS;
                        } else {
                            this.scanningState = ScanningState.TERMINATOR;
                        }
                        break;
                    }
                    case (ScanningState.ARGUMENTS): {
                        if (this.receivedData[(this.readCursor + i)] === "\r".charCodeAt(0)) {
                            this.scanningState = ScanningState.TERMINATOR;
                            continue; // We do this so we do not increment i.
                            // REVIEW: Will i still increment anyway? Will continue just break us out of the switch?
                        }
                        currentArguments += String.fromCharCode(this.receivedData[(this.readCursor + i)]);
                        break;
                    }
                    case (ScanningState.TERMINATOR): {
                        // TODO: For TERMINATOR, if verb === "DATA", change to DATA
                        if (this.receivedData[(this.readCursor + i)] === "\r".charCodeAt(0)) {
                            if (currentTerminator === "\r") {
                                // TODO: Respond your command ended with two consecutive CR
                                resolve(commands);
                            } 
                            currentTerminator = "\r";
                            break;
                        } else if (this.receivedData[(this.readCursor + i)] === "\n".charCodeAt(0)) {
                            if (currentTerminator === "\r") {
                                this.scanningState = ScanningState.COMMAND;
                                commands.push({
                                    verb: currentVerb,
                                    arguments: currentArguments,
                                    data: Buffer.alloc(0)
                                });
                            }
                            if (currentTerminator === "") {
                                // TODO: Respond your command ended with an LF instead of CRLF.
                                resolve(commands);
                            }
                        }
                    }
                    case (ScanningState.MULTILINE): {
                        const indexOfMultilineTerminator : number =
                            this.receivedData.indexOf("\r\n.\r\n", (this.readCursor + i));
                        if (indexOfMultilineTerminator === -1) resolve(commands);
                        // REVIEW: Will execution continue?
                        commands.push({
                            verb: currentVerb,
                            arguments: currentArguments,
                            data: this.receivedData.slice(i, indexOfMultilineTerminator)
                        });
                        i = (indexOfMultilineTerminator - this.readCursor);
                        this.scanningState = ScanningState.MULTILINE_TERMINATOR;
                        continue;
                    }
                    case (ScanningState.MULTILINE_TERMINATOR): {
                        const indexOfMultilineTerminator : number =
                            this.receivedData.indexOf("\r\n.\r\n", (this.readCursor + i));
                        if (indexOfMultilineTerminator !== (this.readCursor + i)) {
                            this.respond(500, "No multiline terminator found.");
                        }
                    }
                }
                i++;
            }
            resolve(commands);
        });
    }

    private static isAlphabeticCharacter (characterCode : number) : boolean {
        return (
            (characterCode >= 65 && characterCode <=  90) || // 'A' through 'Z'
            (characterCode >= 97 && characterCode <= 122)    // 'a' through 'z'
        );
    }

    private digestUntilIndex (endIndex : number) : void {
        // REVIEW: Can this throw?
        const parsedCommand : string = this.receivedData.slice(this.readCursor, endIndex).toString("ascii").toUpperCase();
        if (parsedCommand === "DATA")
            this.respond(354, "Begin message input. Terminate the message with '<CR><LF>.<CR><LF>'.");
        // TODO: Validate command here.
        // parsedCommand = parsedCommand.toUpperCase(); // TODO: Quote spec about case insensitivity.
        const indexOfEndOfCommand : number = this.findEndOfCommand(parsedCommand);
        if (indexOfEndOfCommand === -1) return;
        const args : Buffer =  this.receivedData.slice((this.readCursor + parsedCommand.length + " ".length), indexOfEndOfCommand);
        // this.dispatchCommand(parsedCommand, args);
        this.readCursor = indexOfEndOfCommand;
        if (parsedCommand in Scanner.commandTerminators)
            this.readCursor += Scanner.commandTerminators[parsedCommand].length;
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

    private respond (code : number, message : string) : void {
        this.socket.write(`${code} ${message}\r\n`);
    }
}
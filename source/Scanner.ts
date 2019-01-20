import * as net from "net";
import Lexeme from "./Lexeme";
import LexemeType from "./LexemeType";

export default
class Scanner {

    private static readonly MAXIMUM_VERB_LENGTH : number = 32;
    private static readonly MAXIMUM_LINE_LENGTH : number = 512;
    private static readonly LINE_TERMINATOR : string = "\r\n";
    private static readonly DATA_TERMINATOR : string = "\r\n.\r\n";
    private receivedData : Buffer = Buffer.alloc(0);
    private scanCursor : number = 0;

    constructor (readonly socket : net.Socket) {}

    // TODO: Make this clear the buffer periodically.
    public enqueueData (data : Buffer) : void {
        this.receivedData = Buffer.concat([ this.receivedData, data ]);
    }

    public scanLine () : Lexeme | null {
        const indexOfCRLF : number = this.receivedData.indexOf(Scanner.LINE_TERMINATOR, this.scanCursor);
        if (indexOfCRLF === -1) return null;
        if ((indexOfCRLF - this.scanCursor) > Scanner.MAXIMUM_LINE_LENGTH) {
            this.respond(500, `Command verb too long. Cannot exceed ${Scanner.MAXIMUM_VERB_LENGTH} characters.`);
            this.scanCursor = (indexOfCRLF + Scanner.LINE_TERMINATOR.length);
            return null;
        }
        const lexeme : Lexeme = new Lexeme(
            LexemeType.COMMANDLINE,
            this.receivedData.slice(this.scanCursor, indexOfCRLF)
        );
        this.scanCursor = (indexOfCRLF + Scanner.LINE_TERMINATOR.length);
        return lexeme;
    }

    public scanData () : Lexeme | null {
        const indexOfCRLFDotCRLF : number = this.receivedData.indexOf(Scanner.DATA_TERMINATOR, this.scanCursor);
        if (indexOfCRLFDotCRLF === -1) return null;
        // TODO: Validate maximum DATA line lengths.
        const lexeme : Lexeme = new Lexeme(
            LexemeType.DATA,
            this.receivedData.slice(this.scanCursor, indexOfCRLFDotCRLF)
        );
        this.scanCursor = (indexOfCRLFDotCRLF + Scanner.DATA_TERMINATOR.length);
        return lexeme;
    }

    // TODO: Implement this, obviously.
    public scanChunk () : Lexeme | null {
        return null;
    }

    private static isAlphabeticCharacter (characterCode : number) : boolean {
        return (
            (characterCode >= 65 && characterCode <=  90) || // 'A' through 'Z'
            (characterCode >= 97 && characterCode <= 122)    // 'a' through 'z'
        );
    }

    private respond (code : number, message : string) : void {
        this.socket.write(`${code} ${message}\r\n`);
    }
}
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Lexeme_1 = require("./Lexeme");
class Scanner {
    constructor(socket) {
        this.socket = socket;
        this.receivedData = Buffer.alloc(0);
        this.scanCursor = 0;
    }
    enqueueData(data) {
        this.receivedData = Buffer.concat([this.receivedData.slice(this.scanCursor), data]);
        this.scanCursor = 0;
    }
    scanLine() {
        const indexOfCRLF = this.receivedData.indexOf(Scanner.LINE_TERMINATOR, this.scanCursor);
        if (indexOfCRLF === -1)
            return null;
        if ((indexOfCRLF - this.scanCursor) > Scanner.MAXIMUM_LINE_LENGTH) {
            this.respond(500, `Command verb too long. Cannot exceed ${Scanner.MAXIMUM_VERB_LENGTH} characters.`);
            this.scanCursor = (indexOfCRLF + Scanner.LINE_TERMINATOR.length);
            return null;
        }
        const lexeme = new Lexeme_1.default(0, this.receivedData.slice(this.scanCursor, indexOfCRLF));
        this.scanCursor = (indexOfCRLF + Scanner.LINE_TERMINATOR.length);
        return lexeme;
    }
    scanData() {
        const indexOfCRLFDotCRLF = this.receivedData.indexOf(Scanner.DATA_TERMINATOR, this.scanCursor);
        if (indexOfCRLFDotCRLF === -1)
            return null;
        const lexeme = new Lexeme_1.default(1, this.receivedData.slice(this.scanCursor, indexOfCRLFDotCRLF));
        this.scanCursor = (indexOfCRLFDotCRLF + Scanner.DATA_TERMINATOR.length);
        return lexeme;
    }
    scanChunk() {
        return null;
    }
    static isAlphabeticCharacter(characterCode) {
        return ((characterCode >= 65 && characterCode <= 90) ||
            (characterCode >= 97 && characterCode <= 122));
    }
    respond(code, message) {
        this.socket.write(`${code} ${message}\r\n`);
    }
}
Scanner.MAXIMUM_VERB_LENGTH = 32;
Scanner.MAXIMUM_LINE_LENGTH = 512;
Scanner.LINE_TERMINATOR = "\r\n";
Scanner.DATA_TERMINATOR = "\r\n.\r\n";
exports.default = Scanner;
//# sourceMappingURL=Scanner.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Lexeme {
    constructor(type, token) {
        this.type = type;
        this.token = token;
    }
    getCommand() {
        if (this.type !== 0)
            return "";
        if (this.token.length === 0)
            return "";
        const indexOfFirstSpace = this.token.indexOf(" ");
        const command = ((indexOfFirstSpace === -1) ?
            this.token : this.token.slice(0, indexOfFirstSpace));
        if (!command.every(Lexeme.isAlphabeticCharacter))
            return "";
        return command.toString();
    }
    getArguments() {
        if (this.type !== 0)
            return "";
        if (this.token.length === 0)
            return "";
        const indexOfFirstSpace = this.token.indexOf(" ");
        const args = ((indexOfFirstSpace === -1) ?
            Buffer.alloc(0) : this.token.slice(indexOfFirstSpace + 1));
        return args.toString();
    }
    static isAlphabeticCharacter(characterCode) {
        return ((characterCode >= 65 && characterCode <= 90) ||
            (characterCode >= 97 && characterCode <= 122));
    }
}
exports.default = Lexeme;
//# sourceMappingURL=Lexeme.js.map
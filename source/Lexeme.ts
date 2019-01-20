import LexemeType from "./LexemeType";

export default
class Lexeme {
    constructor (
        readonly type : LexemeType,
        readonly token : Buffer
    ) {}

    public getCommand () : string {
        if (this.type !== LexemeType.COMMANDLINE) return "";
        if (this.token.length === 0) return "";
        const indexOfFirstSpace : number = this.token.indexOf(" ");
        const command : Buffer = ((indexOfFirstSpace === -1) ?
            this.token : this.token.slice(0, indexOfFirstSpace));
        if (!command.every(Lexeme.isAlphabeticCharacter)) return "";
        return command.toString();
    }

    public getArguments () : string {
        if (this.type !== LexemeType.COMMANDLINE) return "";
        if (this.token.length === 0) return "";
        const indexOfFirstSpace : number = this.token.indexOf(" ");
        const args : Buffer = ((indexOfFirstSpace === -1) ?
            Buffer.alloc(0) : this.token.slice(indexOfFirstSpace + 1));
        return args.toString();
    }

    private static isAlphabeticCharacter (characterCode : number) : boolean {
        return (
            (characterCode >= 65 && characterCode <=  90) || // 'A' through 'Z'
            (characterCode >= 97 && characterCode <= 122)    // 'a' through 'z'
        );
    }
}
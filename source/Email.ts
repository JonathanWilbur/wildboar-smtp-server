export default
class Email {
    constructor (
        readonly from : string,
        readonly to : string[],
        readonly subject : string,
        readonly body : string
    ) {}
}
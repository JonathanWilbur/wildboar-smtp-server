import Temporal from "./Temporal";
import UniquelyIdentified from "./UniquelyIdentified";
const uuidv4 : () => string = require("uuid/v4");

export default
class Email implements Temporal, UniquelyIdentified {

    public readonly id : string = `urn:uuid:${uuidv4()}`;
    public readonly creationTime : Date = new Date();

    constructor (
        readonly from : string,
        readonly to : string[],
        readonly subject : string,
        readonly body : string
    ) {}

}
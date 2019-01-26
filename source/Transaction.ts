import Recipient from "./Recipient";
import Temporal from "./Temporal";
import UniquelyIdentified from "./UniquelyIdentified";

export default
interface Transaction extends Temporal, UniquelyIdentified {
    creationTime: Date,
    from : string,
    to : Recipient[],
    data : Buffer
}
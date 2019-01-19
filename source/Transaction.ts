import Recipient from "./Recipient";

export default
interface Transaction {
    from : string,
    to : Recipient[],
    data : Buffer
}
import Email from "./Email";

export default
interface MessageBroker {
    publishEmail (email : Email) : void;
}
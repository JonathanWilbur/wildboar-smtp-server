import Email from "./Email";
import Temporal from "./Temporal";
import UniquelyIdentified from "./UniquelyIdentified";

type EmailMessage = {
    server : UniquelyIdentified & Temporal,
    connection : UniquelyIdentified & Temporal,
    messageBroker : UniquelyIdentified,
    configuration : UniquelyIdentified,
    transaction : UniquelyIdentified & Temporal,
    email : Email
};
export default EmailMessage;
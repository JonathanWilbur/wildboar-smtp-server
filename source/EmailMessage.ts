import Email from "./Email";
import Temporal from "./Temporal";
import UniquelyIdentified from "./UniquelyIdentified";

// NOTE: The "{ [ prop : string] : any }" occurrences below mean "accept
// any additional fields in this object."
// See: https://www.typescriptlang.org/docs/handbook/interfaces.html.
type EmailMessage = {
    server : UniquelyIdentified & Temporal & { [ prop : string] : any },
    connection : UniquelyIdentified & Temporal & { [ prop : string] : any },
    messageBroker : UniquelyIdentified & { [ prop : string] : any },
    configuration : UniquelyIdentified & { [ prop : string] : any },
    transaction : UniquelyIdentified & Temporal & { [ prop : string] : any },
    email : Email
};
export default EmailMessage;
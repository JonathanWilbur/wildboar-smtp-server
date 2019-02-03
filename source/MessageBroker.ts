import EmailMessage from "./EmailMessage";
import UniquelyIdentified from "./UniquelyIdentified";

export default
interface MessageBroker extends UniquelyIdentified {

    acceptInboundEmail (message : EmailMessage) : void;
    acceptOutboundEmail (message : EmailMessage) : void;
    rejectInboundEmail (message : EmailMessage) : void;
    rejectOutboundEmail (message : EmailMessage) : void;
    publishEvent (topic : string, message : object) : void;
    
    // These use RPC
    checkAuthentication (saslMechanism : string, message : object) : Promise<boolean>;
    checkAuthorization (message : object) : boolean;
    verify (user : string) : object[];
    expand (list : string) : object[];

    close () : void;
}
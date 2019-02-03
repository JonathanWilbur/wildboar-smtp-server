import MessageBroker from "../MessageBroker";
import SASLAuthenticationMechanism from "../SASLAuthenticationMechanism";
const uuidv4 : () => string = require("uuid/v4");

export default
class PlainSASLAuthentication implements SASLAuthenticationMechanism {

    public static readonly mechanismName : string = "PLAIN";
    private authorizationIdentity : string | undefined;
    private authenticationIdentity : string | undefined;
    private password : string | undefined;

    constructor (
        readonly messageBroker : MessageBroker
    ) {}

    processBase64Response (response : string) : void {
        const responseFields : string[] = Buffer.from(response, "base64").toString().split("\x00");
        if (responseFields.length < 2 || responseFields.length > 3) return;
        // This technically goes against the spec, but it's not necessary.
        // for (const rf of responseFields) { if (rf.length === 0) return; }
        if (responseFields.length === 2) {
            this.authorizationIdentity = responseFields[0];
            this.authenticationIdentity = responseFields[0];
            this.password = responseFields[1];
        } else { // Authorization Identity is included.
            this.authorizationIdentity = responseFields[0];
            this.authenticationIdentity = responseFields[1];
            this.password = responseFields[2];
        }

    }

    nextBase64Challenge () : string | null {
        if (!this.authenticationIdentity || !this.password) return "";
        else return null;
    }

    getAuthenticatedLocalPart () : Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.messageBroker.checkAuthentication(PlainSASLAuthentication.mechanismName, {
                id: `urn:uuid:${uuidv4()}`,
                authorizationIdentity: this.authorizationIdentity,
                authenticationIdentity: this.authenticationIdentity,
                password: this.password
            }).then((authenticated : boolean) => {
                if (authenticated) resolve(this.authorizationIdentity);
                reject("Authentication failure.");
            });
        });
    }
}
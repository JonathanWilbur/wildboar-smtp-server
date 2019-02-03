"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuidv4 = require("uuid/v4");
class PlainSASLAuthentication {
    constructor(messageBroker) {
        this.messageBroker = messageBroker;
    }
    processBase64Response(response) {
        const responseFields = Buffer.from(response, "base64").toString().split("\x00");
        if (responseFields.length < 2 || responseFields.length > 3)
            return;
        if (responseFields.length === 2) {
            this.authorizationIdentity = responseFields[0];
            this.authenticationIdentity = responseFields[0];
            this.password = responseFields[1];
        }
        else {
            this.authorizationIdentity = responseFields[0];
            this.authenticationIdentity = responseFields[1];
            this.password = responseFields[2];
        }
    }
    nextBase64Challenge() {
        if (!this.authenticationIdentity || !this.password)
            return "";
        else
            return null;
    }
    getAuthenticatedLocalPart() {
        return new Promise((resolve, reject) => {
            this.messageBroker.checkAuthentication(PlainSASLAuthentication.mechanismName, {
                id: `urn:uuid:${uuidv4()}`,
                authorizationIdentity: this.authorizationIdentity,
                authenticationIdentity: this.authenticationIdentity,
                password: this.password
            }).then((authenticated) => {
                if (authenticated)
                    resolve(this.authorizationIdentity);
                reject("Authentication failure.");
            });
        });
    }
}
PlainSASLAuthentication.mechanismName = "PLAIN";
exports.default = PlainSASLAuthentication;
//# sourceMappingURL=Plain.js.map
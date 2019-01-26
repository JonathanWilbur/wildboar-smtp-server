"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuidv4 = require("uuid/v4");
class Email {
    constructor(from, to, subject, body) {
        this.from = from;
        this.to = to;
        this.subject = subject;
        this.body = body;
        this.id = `urn:uuid:${uuidv4()}`;
        this.creationTime = new Date();
    }
}
exports.default = Email;
//# sourceMappingURL=Email.js.map
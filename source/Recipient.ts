export default
interface Recipient {

    // From RFC 5321, Section 4.1.1.3:
    // "Sending systems SHOULD NOT generate the optional list of
    // hosts known as a source route.  Receiving systems MUST recognize
    // source route syntax but SHOULD strip off the source route
    // specification and utilize the domain name associated with the mailbox
    // as if the source route had not been provided.
    // Similarly, relay hosts SHOULD strip or ignore source routes, and
    // names MUST NOT be copied into the reverse-path.  When mail reaches
    // its ultimate destination (the forward-path contains only a
    // destination mailbox), the SMTP server inserts it into the destination
    // mailbox in accordance with its host mail conventions."
    sourceRoutes : string[],
    destinationMailbox : string
}
# Wildboar SMTP Server

* Author: [Jonathan M. Wilbur](https://jonathan.wilbur.space) <[jonathan@wilbur.space](mailto:jonathan@wilbur.space)>
* Copyright Year: 2019
* License: [MIT License](https://mit-license.org/)
* Version: _See `version` file or git tags._

This is an SMTP Receiver that is meant to be a part of a larger group of
microservices running in a Docker Compose app. This is still a work in
progress. The documentation below, too, is a work in progress; what you see
below will likely not look anything like the final readme. It is more of a dump
of my architectural decisions.

Goals:

- Extreme security
- Extreme modularity and customizability
- Extreme throughput through scalability

Non-Goals:

- Low latency
- Extreme throughput through code optimization

## Standards

This application attempts to conform to
[Wildboar Microservices Architecture Standard](https://github.com/JonathanWilbur/wildboar-microservices).

## Configuration

Wildboar SMTP Server currently obtains all configuration directives from
environment variables, but it uses dependency injection as a modular way
of accepting configuration directives from any source, so you could write
alternative modules for reading configuration directives.

My intention in using environment variables as the sole source of configuration
is to make Wildboar SMTP Server more conducive to containerized deployment.

## TLS / SMTPS

Wildboar SMTP Server is meant to run behind a TLS terminator, such as Nginx.
Having no application-layer means of communicating with the TLS server,
STARTTLS will likely never be supported. But STARTTLS is innately insecure
anyway.

## Message Transport

Protocol: AMQP, but others may be supported later on.
Serialization: JSON
Compression: None

## Work Queues, Pub-Sub, and RPC

- Email messages
  - Will be published to one of these exchanges:
    - Inbound Email
    - Outbound Email
    - Rejected Inbound Email
    - Rejected Outbound Email
  - The routing key will be an identifier of the last stage through which
    in which an email was processed.
    - Examples: `smtp-server`, `spam-filter`, `dkim-validation`, etc.
    - This allows emails to be reinserted in the queue, with a tag that
      effectively indicates which subscriber should process it next.
- Log messages / events will be delivered through topic-based pub-sub.
- Authentication will be handled through queue-mediated RPC.
  - The request will contain the authentication factors.
  - The requests will be direct-routed from an exchange to mechanism-specific
    queues, such as "PLAIN", "CRAM-MD5", etc.
  - So that multiple workers can potentially attempt to authenticate a user,
    ACKs will be used to signal that a worker successfully authenticated.
  - The response will contain a boolean affirming authentication, as well as
    optional attribute assertions (much like SAML).
  - Configuration options determine whether to set up certain authentication
    mechanism queues.
  - The replyTo queue is pub/sub, because there could be multiple SMTP servers
    which should read responses, and use the UUID-URN to determine which
    connection just authenticated successfully.
- I think Authorization will be a separate but similar queue from the
  Authentication queue, but I will decide when I implement it.
- Email list/group lookup will use queue-mediated RPC, like authentication.

## Email Storage

Initially, this will store emails in Minio, the FOSS S3-compatible object
store. In the future, there will be support for storage in MongoDB, MariaDB,
MySQL, and, of course, the native filesystem itself.

## Consumers / Workers

Emails are immediately placed in a message queue when received and accepted,
and programs on the other end are expected to further process them or store
them.

An example of this would be SPF validation: an email placed in the
message queue would be placed there with the originating IP address, and the
SPF validation consumer would be responsible for popping a message from the
queue, confirming that the SPF record matches the originating IP, and pushing
the message back on another queue (or possibly the same queue, but with an
indication that SPF has passed validation for that message) for further
processing or storage if it passes validation, or dropping the message and
logging the validation failure if it fails validation.

Another example would be scam filtering: an email placed in the message queue
would be read by a scam filtering consumer, that would look for emails that
contain three or more of the words "African," "prince," "account," "million,"
and drop them or label them as potentially dangerous.

### Consumer Signatures

The function or method that first accepts a message from the message queue for
processing MUST have a signature that matches a valid AWS Lambda function
written in the same language. If AWS Lambda does not support such a language,
a best attempt MUST be made to match the function or method signature to one
which AWS Lambda would likely use if said language were an option for AWS Lambda.

The reason for doing this is to ensure that consumers can be easily converted
to AWS Lambda functions.

## Identifiers

Applications throughout this environment, where permissible, shall use version
4 UUIDs in the form of a URN as identifiers. In any such uniquely-identified
object, the field or key for which this URN shall be a value shall be named
`id`, with lowercase letters used exclusively, when possible.

An example of UUID-URN looks like this:

```
urn:uuid:10ba038e-48da-487b-96e8-8d3b99b6d18a
```

The following objects MUST be labeled with a UUID-URN, and provide read-only
access to their identifiers to other objects:

- Any object that represents a server
  - This includes raw listening sockets
- Any object that represents a client
  - This includes raw sockets
- Any object that represents a message
- Any object that represents a user or person
  - Identifiers of users or people, such as email addressess, do not apply
- Any object that represents a login session
- Any object that represents a transaction
- Any configuration object or driver

The following objects MUST NOT be labeled with a UUID-URN:

- Lexemes produced by a lexer / Tokens produced by a scanner
- Productions produced by a parser
- Other identifiers or addresses

Any object with a UUID-URN must include its UUID-URN when serialized for
placement in a message queue. When an object with a UUID-URN is mentioned in a
log / event message, the UUID-URN shall be included in the message, even if it
is not transported through the use of a message queue.

For instance, when an email is received by the Wildboar SMTP
Server and placed in the message queue, a UUID-URN shall be affixed to the
serialized message, and to the email itself, since there could be multiple
email messages contained in an AMQP, STOMP, ZMQP, or other queueing message.
(For now, such many-to-one mappings of emails to queue messages are to be
eschewed.) Further, the server, which shall have a UUID-URN, and the connection
that originated said email and was formed by said server, shall also have a
UUID-URN and both of these objects shall include their identifiers in any
messages they generate.

The use of a URN both namespaces an identifier and explicitly stating the
specification to which it conforms. To clarify, one could mistake a UUID for a
Microsoft SID, which the URN namespace above prevents by disambiguating.

## Encryption

Initially, the Wildboar Email Stack (WES) will use Minio as email storage, and
encryption-at-rest will be used to secure said emails.

Because of SMTP's innate security issues, this specification cannot mandate
encryption-in-transit, but encryption-in-transit SHOULD be used wherever
possible, and unencrypted transit disabled wherever possible.

Even traffic that is internal to the stack SHOULD be encrypted, since it is
possible that internal components may be replaced with external components,
such as replacing the Minio store with AWS S3, or replacing the RabbitMQ
message queue with AWS SQS.

## Queue Configuration

- Use Lazy Queues
- Use ACKs
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

## Message Serialization

All messages shall be serialized in JSON. Even though binary serialization
formats like Google's Protocol Buffers, ASN.1 Basic Encoding Rules, or
Parquet may be fine for sending messages, the overwhelming majority of data
transferred will come from the message bodies of emails or log messages,
rather than flags or other metadata. This means that using a binary protocol
would afford the Wildboar Email Stack (WES) almost no data compression.

Also, JSON is probably the most widely supported / understood serialization
format, and in most programming languages, it is supported in the standard
library. If I used another serialization format, I would have to pull in
another dependency.

Finally, JSON is readily accepted by most REST APIs, which makes integrating
components of the Wildboar Email Stack far easier.

Compression MUST NOT be used in the transport or store of messages or parts of
messages (including contained email bodies or attachments), unless said
contents were compressed upon receipt from an external source. To clarify, this
rule does not apply to the storage of email messages, which may be stored in
any way.

### JSON Message Structure

#### The Root Element

The root element of each JSON document sent via the messaging queue shall be
an object--not an array. If the data intended for transmission is an array,
it shall still be encoded as a member of the root object; it shall not be
the root object in the message itself.

#### Anti-XSSI Prefix

All JSON messages shall be prefixed with an [Anti-XSSI prefix](https://security.stackexchange.com/questions/110539/how-does-including-a-magic-prefix-to-a-json-response-work-to-prevent-xssi-attack),
composed of these exact characters: `)]}'`. Prior to de-serializing said JSON
message, this prefix should be stripped by the receiving application. There
MUST be no whitespace added before those characters, but deserializing
applications SHOULD be able to handle leading whitespace nevertheless.

#### Serializing Identifiers

- UUID-URNs should be serialized as described below.
- IP addresses of all versions shall be serialized as strings.
- MAC addresses and all other related IEEE identifiers shall be serialized
  as strings.
- Object identifiers (as specified in the ITU's X.660) shall be serialized as
  an array of integers.
- URIs, URLs, and URNs shall be serialized as strings.

#### Serializing Time Types

All dates and times MUST:

- Be serialized as strings
- Contain no leading or trailing whitespace
- Comply with ISO 8601:2004 specifications

All services that deserialize dates and times SHOULD:

- Either:
  - Be able to understand ISO 8601 negative or positive years, or
  - Fail gracefully.

#### Serializing Dates

#### Serializing Times

Times by themselves shall never be used. A timestamp must be used instead,
which associates a specific date.

#### Serializing Timestamps

All timestamps MUST:

- Be in UTC, which entails the inclusion of a `Z` at the end of the ISO 8601 timestamp.

#### Unit Tests for JSON-encoding compliance

REVIEW: Is this really applicable anymore?

- The first characters of the message are `)]}'`, followed by optional
  whitespace, followed by an opening curly bracket, `{`.
- The last non-whitespace character of the message is `}`.
- The second-to-last non-whitespace character of the message is not a comma, `,`.

## Message Transport

All messages shall be transported through RabbitMQ, but I will try to keep the
dependency on RabbitMQ loosely coupled. I would like the Wildboar Email Stack
to at least support ZeroMQ as well. Initially, I am going with RabbitMQ,
because it seems more popular and well-supported, as well as easier to use,
not in the least because there is a web interface for interacting with it.

AMQP will be the protocol of choice for communication. I briefly tried to make
STOMP work, only because I was able to find a suitable TypeScript library for
it, unlike AQMP. Unfortunately, I had so much trouble getting STOMP to work,
I have to opt for AMQP. In hindsight, it makes more sense, anyway, because
AMQP is a binary protocol, so it is lighter, whereas STOMP is text-based.

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
  - The response will contain a boolean affirming authentication, as well as
    optional attribute assertions (much like SAML).
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

## Code

If an object includes an `id` field, this field must be the first member of the
object. If an object includes a `creationTime` field, this field must be the
second field if an `id` field is included, or the first field if there is no
`id` field. If the `creationTime` field can be initialized from outside of the
constructor, it MUST be. If the `creationTime` field can only be initialized
from within the constructor, it MUST be initialized first.

## Queue Configuration

- Use Lazy Queues
- Use ACKs
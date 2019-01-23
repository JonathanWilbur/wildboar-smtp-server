# Wildboar SMTP Server

* Author: [Jonathan M. Wilbur](https://jonathan.wilbur.space) <[jonathan@wilbur.space](mailto:jonathan@wilbur.space)>
* Copyright Year: 2019
* License: [MIT License](https://mit-license.org/)
* Version: _See `version` file or git tags._

This is an SMTP Receiver that is meant to be a part of a larger group of
microservices running in a Docker Compose app. This is still a work in
progress.

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
STARTTLS will likely never be supported. But STARTTLS suffers various security
drawbacks, anyway.

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

- Obtained emails will be published to a work queue using direct routing.
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
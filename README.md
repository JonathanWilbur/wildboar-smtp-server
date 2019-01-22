# Wildboar SMTP Server

* Author: [Jonathan M. Wilbur](https://jonathan.wilbur.space) <[jonathan@wilbur.space](mailto:jonathan@wilbur.space)>
* Copyright Year: 2019
* License: [MIT License](https://mit-license.org/)
* Version: _See `version` file or git tags._

This is an SMTP Receiver that is meant to be a part of a larger group of
microservices running in a Docker Compose app. This particular microservice
simply receives SMTP commands and stashes the resulting message in a
RabbitMQ queue. This is still a work in progress.

## Configuration

Wildboar SMTP Server currently obtains all configuration directives from
environment variables, but it uses dependency injection as a modular way
of accepting configuration directives from any source, so you could write
alternative modules for reading configuration directives.

My intention in using environment variables as the sole source of configuration
is to make Wildboar SMTP Server more conducive to containerized deployment.

## TLS

Wildboar SMTP Server is meant to run behind a TLS terminator, such as Nginx.
Having no application-layer means of communicating with the TLS server,
STARTTLS will likely never be supported. But STARTTLS suffers various security
drawbacks, anyway.
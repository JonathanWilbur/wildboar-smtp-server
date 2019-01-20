# SMTP Receiver

* Author: [Jonathan M. Wilbur](https://jonathan.wilbur.space) <[jonathan@wilbur.space](mailto:jonathan@wilbur.space)>
* Copyright Year: 2019
* License: [MIT License](https://mit-license.org/)
* Version: _See `version` file or git tags._

This is an SMTP Receiver that is meant to be a part of a larger group of
microservices running in a Docker Compose app. This particular microservice
simply receives SMTP commands and stashes the resulting message in a
RabbitMQ queue. This is still a work in progress.

It will use a key-value store as a configuration database instead of text
files. I have not decided on which one I will use yet.
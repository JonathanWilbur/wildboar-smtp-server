FROM node:11.7.0-alpine
LABEL author "Jonathan M. Wilbur <jonathan@wilbur.space>"
RUN mkdir -p /srv/smtp-server
WORKDIR /srv/smtp-server
COPY . /srv/smtp-server/
# COPY ./entrypoint.sh /srv/smtp-server/entrypoint.sh
RUN chmod +x /srv/smtp-server/entrypoint.sh
ENTRYPOINT [ "/srv/smtp-server/entrypoint.sh" ]
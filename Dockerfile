FROM node:11.7.0-alpine
LABEL author "Jonathan M. Wilbur <jonathan@wilbur.space>"
RUN mkdir -p /srv/smtp-server
WORKDIR /srv/smtp-server
ADD ./dist /srv/smtp-server/
ENTRYPOINT [ "node", "index.js" ]
FROM alpine:latest

RUN apk update && \
    apk add --no-cache git openssh

WORKDIR /repo

COPY . /repo

CMD ["/bin/sh"] 
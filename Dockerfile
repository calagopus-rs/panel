FROM alpine:latest

# Add panel-rs and entrypoint
ARG TARGETPLATFORM
COPY .docker/${TARGETPLATFORM#linux/}/panel-rs /usr/bin/panel-rs

ENTRYPOINT ["/usr/bin/panel-rs"]

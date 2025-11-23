FROM alpine:latest

# Add panel-rs and entrypoint
ARG TARGETPLATFORM
COPY .docker/${TARGETPLATFORM#linux/}/panel-rs /usr/bin/panel-rs

ENV OCI_CONTAINER=official

ENTRYPOINT ["/usr/bin/panel-rs"]

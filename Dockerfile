FROM gcr.io/distroless/cc-debian12

# Copy gathered binaries and libs
COPY --from=builder /build/gathered/ /

# Add panel-rs and entrypoint
ARG TARGETPLATFORM
COPY .docker/${TARGETPLATFORM#linux/}/panel-rs /usr/bin/panel-rs

ENV LD_LIBRARY_PATH=/lib:/usr/lib
ENTRYPOINT ["/usr/bin/panel-rs"]

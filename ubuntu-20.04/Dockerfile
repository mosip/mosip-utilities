FROM ubuntu:20.04

ARG SOURCE
ARG COMMIT_HASH
ARG COMMIT_ID
ARG BUILD_TIME
LABEL source=${SOURCE}
LABEL commit_hash=${COMMIT_HASH}
LABEL commit_id=${COMMIT_ID}
LABEL build_time=${BUILD_TIME}

# Install mc and its dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl wget vim \

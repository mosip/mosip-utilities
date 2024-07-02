FROM ubuntu:24.04

ENV JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
ENV PATH=/usr/lib/jvm/java-21-openjdk-amd64/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ENV JAVA_VERSION=21
ENV LANG=C.UTF-8

# Install mc and its dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends openjdk-21-jdk wget unzip && \
    java --version

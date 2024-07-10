FROM ubuntu:20.04

# Install OpenSSL, curl, and kubectl
RUN apt-get update && \
    apt-get install -y openssl curl && \
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl && \
    rm kubectl

# Add script and configurations
COPY create-signing-certs.sh /scripts/create-signing-certs.sh
COPY client-openssl.cnf /scripts/client-openssl.cnf
COPY openssl.cnf /scripts/openssl.cnf
COPY root-openssl.cnf /scripts/root-openssl.cnf

# Set permissions for scripts and configurations
RUN chmod +x /scripts/*.sh /scripts/*.cnf

# Set the working directory
WORKDIR /scripts

# Set the entry point
ENTRYPOINT ["/bin/bash", "create-signing-certs.sh"]

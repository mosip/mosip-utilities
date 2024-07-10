FROM ubuntu:20.04

# Define build arguments
ARG SOURCE
ARG COMMIT_HASH
ARG COMMIT_ID
ARG BUILD_TIME
ARG container_user=mosip
ARG container_user_group=mosip
ARG container_user_uid=1001
ARG container_user_gid=1001

# Set labels
LABEL source=${SOURCE}
LABEL commit_hash=${COMMIT_HASH}
LABEL commit_id=${COMMIT_ID}
LABEL build_time=${BUILD_TIME}

# Install packages and create user
RUN apt-get update && \
    apt-get install -y openssl sudo curl && \
    groupadd -g ${container_user_gid} ${container_user_group} && \
    useradd -u ${container_user_uid} -g ${container_user_group} -s /bin/sh -m ${container_user} && \
    echo "${container_user} ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers && \
    usermod -aG sudo ${container_user} && \
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl && \
    rm kubectl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV work_dir=/home/${container_user}

# Copy configuration files to the work directory
COPY create-signing-certs.sh ${work_dir}/create-signing-certs.sh
COPY client-openssl.cnf ${work_dir}/client-openssl.cnf
COPY openssl.cnf ${work_dir}/openssl.cnf
COPY root-openssl.cnf ${work_dir}/root-openssl.cnf

# Set permissions
RUN chmod +x ${work_dir}/*.sh ${work_dir}/*.cnf

# Select container user for all tasks
USER ${container_user_uid}:${container_user_gid}

# Set the working directory for the container
WORKDIR ${work_dir}

# Set the entry point
ENTRYPOINT ["/bin/bash", "create-signing-certs.sh"]

FROM ubuntu:20.04

ARG SOURCE
ARG COMMIT_HASH
ARG COMMIT_ID
ARG BUILD_TIME
LABEL source=${SOURCE}
LABEL commit_hash=${COMMIT_HASH}
LABEL commit_id=${COMMIT_ID}
LABEL build_time=${BUILD_TIME}

# can be passed during Docker build as build time environment for github branch to pickup configuration from.
ARG container_user=mosip

# can be passed during Docker build as build time environment for github branch to pickup configuration from.
ARG container_user_group=mosip

# can be passed during Docker build as build time environment for github branch to pickup configuration from.
ARG container_user_uid=1001

# can be passed during Docker build as build time environment for github branch to pickup configuration from.
ARG container_user_gid=1001

# install packages and create user
RUN apt-get -y update \
&& apt-get install -y openssl sudo\
&& groupadd -g ${container_user_gid} ${container_user_group} \
&& useradd -u ${container_user_uid} -g ${container_user_group} -s /bin/sh -m ${container_user}

# set working directory for the user
WORKDIR /home/${container_user}

ENV work_dir=/home/${container_user}

ENV VALIDITY=
ENV COUNTRY=
ENV STATE=
ENV LOCATION=
ENV ORG=
ENV ORG_UNIT=
ENV COMMON_NAME=

COPY *.sh .

# change permissions of file inside working dir
RUN mkdir -p $work_dir/ssl/certs $work_dir/ssl/private && chown -R ${container_user}:${container_user} /home/${container_user} /usr/bin/openssl /etc/ssl/

# select container user for all tasks
USER ${container_user_uid}:${container_user_gid}

ENTRYPOINT ["/bin/bash","-c","./entrypoint.sh"]
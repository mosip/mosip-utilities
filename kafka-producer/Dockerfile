# syntax=docker/dockerfile:1
FROM python:3.10-slim-buster
RUN pip3 install pipenv

ARG container_user=mosip
ARG container_user_group=mosip
ARG container_user_uid=1001
ARG container_user_gid=1001

# Install packages and create user
RUN apt-get -y update \
&& groupadd -g ${container_user_gid} ${container_user_group} \
&& useradd -u ${container_user_uid} -g ${container_user_group} -s /bin/sh -m ${container_user}

# Permissions
RUN chown -R ${container_user}:${container_user} /home/${container_user}

# Select container user for all tasks
USER ${container_user_uid}:${container_user_gid}

WORKDIR  /home/${container_user}/app

COPY . .
RUN pipenv install --system --deploy --ignore-pipfile
CMD ["python","kafka_producer.py"]


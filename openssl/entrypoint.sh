#!/bin/bash

openssl req -x509 -nodes -days $VALIDITY -newkey rsa:2048 \
-keyout /home/$(whoami)/ssl/private/nginx-selfsigned.key \
-out /home/$(whoami)/ssl/certs/nginx-selfsigned.crt \
--subj "/C=$COUNTRY/ST=$STATE/L=$LOCATION/O=ORG/OU=$ORG_UNIT/CN=$COMMON_NAME/"
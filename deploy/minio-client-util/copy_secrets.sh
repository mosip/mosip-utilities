#!/bin/bash
# Copy secrets from other namespaces
# DST_NS: Destination namespace 
  UTIL_URL=https:https://raw.githubusercontent.com/mosip/mosip-infra/master/deployment/v3/utils/copy_cm_func.sh
  COPY_UTIL=./copy_cm_func.sh

  wget -q $UTIL_URL -O copy_cm_func.sh && chmod +x copy_cm_func.sh

  DST_NS=minio-client-util
  $COPY_UTIL secret s3 s3 $DST_NS


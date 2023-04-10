# Minio client Utility

## Context
* This utility helps to clear objects from S3 buckets.
* The utility is expected to clear objects that are older than specified no of retention days.
* Necesary inputs for the tool are:
  * S3_SERVER_URL
  * S3_ACCESS_KEY 
  * S3_SECRET_KEY
  * S3_BUCKET_NAME
  * S3_RETENTION_DAYS

## Prerequisites
* S3 accessible using the Server URL.
* ACCESS and SECRET Keys keys having delete role for the targetted bucket in S3.
* Docker installed in respective server from where the tool will be executed.

## Install
``` 
sudo docker run -itd \
-e S3_SERVER_URL='<Server URL> \
-e S3_ACCESS_KEY='Access key> \
-e S3_SECRET_KEY='secret key> \
-e S3_BUCKET_NAME='target bucket name' \
-e S3_RETENTION_DAYS='no of retention days' \
-p 80:80 \
-name <CONTAINER NAME> <dockerhub_id/image_name>
```
## Delete
```
sudo docker rm -rf <container id/name>
```

### Restart
```
sudo docker restart <container id/name>

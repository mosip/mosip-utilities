FROM ubuntu

ARG SOURCE
ARG COMMIT_HASH
ARG COMMIT_ID
ARG BUILD_TIME
LABEL source=${SOURCE}
LABEL commit_hash=${COMMIT_HASH}
LABEL commit_id=${COMMIT_ID}
LABEL build_time=${BUILD_TIME}
USER root

# Install mc and its dependencies
RUN apt update && \ 
apt install ca-certificates -y && apt install openssl -y && apt install wget -y && \
wget https://dl.minio.io/client/mc/release/linux-amd64/mc && \
chmod +x mc && mv mc /usr/local/bin 

# Set the environment variables for your Minio server
ENV S3_ACCESS_KEY= 
ENV S3_SECRET_KEY= 
ENV S3_SERVER_URL= 
ENV S3_BUCKET_LIST=
ENV S3_RETENTION_DAYS=

# Delete objects older than 3 days
CMD mc alias set myminio $S3_SERVER_URL $S3_ACCESS_KEY $S3_SECRET_KEY && \
    for S3_BUCKET in $( echo $S3_BUCKET_LIST | sed 's/,/ /g'); do \
       if mc ls myminio/$S3_BUCKET 2>/dev/null; then \
         mc rm --recursive --force --older-than $S3_RETENTION_DAYS myminio/$S3_BUCKET && \
         echo "Objects from $S3_BUCKET bucket older than $S3_RETENTION_DAYS days has been deleted successfully"; \
       else \
         echo "Bucket $S3_BUCKET does not exist or is empty"; \
       fi; \
    done

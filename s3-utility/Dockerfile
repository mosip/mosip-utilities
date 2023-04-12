FROM ubuntu

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
ENV S3_BUCKET_NAME=
ENV S3_RETENTION_DAYS=

# Delete objects older than 3 days
CMD mc alias set myminio $S3_SERVER_URL $S3_ACCESS_KEY $S3_SECRET_KEY && mc rm --recursive --force --older-than $S3_RETENTION_DAYS myminio/$S3_BUCKET_NAME && echo "Objects from $S3_BUCKET_NAME bucket older than $S3_RETENTION_DAYS days has been deleted successfully"



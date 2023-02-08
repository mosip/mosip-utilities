FROM ubuntu

USER root

# Install mc and its dependencies
RUN apt update && \ 
apt install ca-certificates -y && apt install openssl -y && apt install wget -y && \
wget https://dl.minio.io/client/mc/release/linux-amd64/mc && \
chmod +x mc && mv mc /usr/local/bin 

# Set the environment variables for your Minio server
ENV MINIO_ACCESS_KEY= 
ENV S3_SECRET_KEY= 
ENV MINIO_SERVER_URL= 
ENV BUCKET_NAME=
ENV NO_OF_DAYS=

# Delete objects older than 3 days
CMD mc alias set myminio $MINIO_SERVER_URL $MINIO_ACCESS_KEY $S3_SECRET_KEY && mc rm --recursive --force --older-than $NO_OF_DAYS myminio/$BUCKET_NAME && echo "Minio client utility executed successfully"



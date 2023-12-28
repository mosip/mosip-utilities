#!/bin/bash


# Set MinIO configuration using environment variables
MC_SERVER_URL="http://172.16.145.175:9000"
MC_ACCESS_KEY="minioadmin"
MC_SECRET_KEY="minioadmin"
MC_BUCKETS="automation,esignet"
DESTINATION_DIR=/usr/share/nginx/html/reports 


# Set up MinIO alias
/usr/local/bin/mc config host add newminio "$MC_SERVER_URL" "$MC_ACCESS_KEY" "$MC_SECRET_KEY" --api S3v4

# Verify the 'newminio' alias
/usr/local/bin/mc alias ls

# Display the MinIO server information
/usr/local/bin/mc admin info newminio

# Iterate over each bucket
IFS=',' read -ra BUCKET_ARRAY <<< "$MC_BUCKETS"
for BUCKET in "${BUCKET_ARRAY[@]}"; do
  # Download files from MinIO for each bucket
  /usr/local/bin/mc cp -r newminio/"$BUCKET"/auth/ "$DESTINATION_DIR"
done


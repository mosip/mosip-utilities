# Instructions to run the docker container

docker build -t nginx-with-minio-client .

docker run -p 80:80 --name nm --env="TZ=Asia/Kolkata" --volume="/etc/timezone:/etc/timezone:ro" -e MC_SERVER_URL="<minio_url>" -e MC_ACCESS_KEY=<minio_accesskey>-e MC_SECRET_KEY=<minio_secretkey> -e MC_BUCKETS="<bucket_names_separated_by_comma>" -d nginx-with-minio-client


docker exec -it nm /bin/bash

ls /usr/share/nginx/html

# At present, all the values are predefined in the code

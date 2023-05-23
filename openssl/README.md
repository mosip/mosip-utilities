# Generate ssl self-signed certificate

## Prerequisites
* [Docker](https://docs.docker.com/engine/install/)

## Build docker
```
docker build -t openssl:tagname -f Dockerfile .
```

## Generate via docker
* Create a volume that points to the directory local `/etc/ssl` by using the command provided below.
  ```
  docker volume create --name gensslcerts --opt type=none --opt device=/etc/ssl --opt o=bind
  ```
* Execute the following command to generate a self-signed SSL certificate. 
  Prior to execution, kindly ensure that the environmental variables passed to the OpenSSL Docker container have been updated.
  ```
  docker run -it --mount type=volume,src='gensslcerts',dst=/home/mosip/ssl,volume-driver=local \
  -e VALIDITY=700        \
  -e COUNTRY=IN          \
  -e STATE=KAR           \
  -e LOCATION=BLR        \
  -e ORG=MOSIP           \
  -e ORG_UNIT=MOSIP      \
  -e COMMON_NAME=*.sandbox.xyz.net \
  mosipdev/openssl:latest 
  ```
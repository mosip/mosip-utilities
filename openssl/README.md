# Generate ssl self-signed certificate

## Prerequisites
* [Docker](https://docs.docker.com/engine/install/)

## Build docker
```
docker build -t openssl:tagname -f Dockerfile .
```

## Generate via docker
* Create a volume that points to a dedicated, empty host directory (do
  **not** point it at the host's `/etc/ssl` — that lets the container
  overwrite real system certificates, keys, or trust store).

  ```shell
  OPENSSL_OUTPUT_DIR="$(pwd)/openssl-output"
  mkdir -p "$OPENSSL_OUTPUT_DIR"
  docker volume create --name gensslcerts --opt type=none --opt device="$OPENSSL_OUTPUT_DIR" --opt o=bind
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
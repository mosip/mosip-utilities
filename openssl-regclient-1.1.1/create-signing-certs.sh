#!/bin/bash

# warning: do not use the certificates produced by this tool in production. This is for testing purposes only
# This is a reference script; use officially valid code signing certificates in production.

# The script starts from here
set -e  # Exit the script if any command fails

# Get the keystore password from the first argument
KEYSTORE_PWD=$(openssl rand -base64 10)

echo "Keystore password provided: $KEYSTORE_PWD"

# Certificate Authority
echo "===================================="
echo "Creating CA certificate"
echo "===================================="
openssl genrsa -out ./certs/RootCA.key 4096
openssl req -new -x509 -days 1826 -key ./certs/RootCA.key -out ./certs/RootCA.crt -config ./root-openssl.cnf

# Client Certificate
echo "===================================="
echo "Creating CLIENT certificate for CodeSigning"
echo "===================================="
openssl genrsa -out ./certs/Client.key 4096
openssl req -new -key ./certs/Client.key -out ./certs/Client.csr -config ./client-openssl.cnf
openssl x509 -req -extensions v3_req -extfile ./client-openssl.cnf -days 1826 -in ./certs/Client.csr -CA ./certs/RootCA.crt -CAkey ./certs/RootCA.key -set_serial 01 -out ./certs/Client.crt
openssl verify -CAfile ./certs/RootCA.crt ./certs/Client.crt
openssl pkcs12 -export -in ./certs/Client.crt -inkey ./certs/Client.key -out ./certs/keystore.p12 -name "CodeSigning" -password pass:$KEYSTORE_PWD

# Save the password to a file
echo $KEYSTORE_PWD > ./certs/keystore_pwd.txt

# Delete existing ConfigMap and Secret if they exist
echo "Deleting existing ConfigMap and Secret if they exist..."
kubectl delete configmap regclient-certs -n "$NAMESPACE" --ignore-not-found=true
kubectl delete secret keystore-secret-env -n "$NAMESPACE" --ignore-not-found=true
echo "Existing ConfigMap and Secret deleted."

# Create new ConfigMap with certificates
echo "Creating new ConfigMap with certificates..."
kubectl create configmap -n "$NAMESPACE" regclient-certs \
  --from-file=/scripts/certs/Client.crt \
  --from-file=/scripts/certs/Client.csr \
  --from-file=/scripts/certs/Client.key \
  --from-file=/scripts/certs/RootCA.crt \
  --from-file=/scripts/certs/RootCA.key \
  --from-file=/scripts/certs/keystore.p12 \
  -o yaml --dry-run=client | kubectl apply -f - || { echo "Failed to create ConfigMap"; exit 1; }
echo "New ConfigMap created."

# Create new Secret with keystore password
echo "Creating new Secret with keystore password..."
kubectl create secret generic -n "$NAMESPACE" keystore-secret-env \
  --from-literal=keystore_secret_env=$KEYSTORE_PWD \
  -o yaml --dry-run=client | kubectl apply -f - || { echo "Failed to create Secret"; exit 1; }
echo "New Secret created."

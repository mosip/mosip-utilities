#!/bin/bash
# Installs minio-client
## Usage: ./install.sh [kubeconfig]

if [ $# -ge 1 ] ; then
  export KUBECONFIG=$1
fi

NS=minio-client
CHART_VERSION=12.0.2

echo Create $NS namespace
kubectl create ns $NS


function installing_minio-client() {
  echo Istio label
  kubectl label ns $NS istio-injection=disabled --overwrite

  echo "Build minio-client charts"
  cd minio-client-helm
  helm dependency update

  cd ../

  echo Copy secrets
  ./copy_secrets.sh

  echo Installing minio-client
  helm -n $NS install minio-client ./minio-client-helm --version $CHART_VERSION
  
  echo Installed minio-client utility
  return 0
}

# set commands for error handling.
set -e
set -o errexit   ## set -e : exit the script if any statement returns a non-true return value
set -o nounset   ## set -u : exit the script if you try to use an uninitialised variable
set -o errtrace  # trace ERR through 'time command' and other functions
set -o pipefail  # trace ERR through pipes
installing_minio-client  # calling function

# INSTRUCTIONS

## Overview
This is a dockerized cron job that performs the following:

1. Checks if below mentioned 3 probes are allocated to the services:
   1. startup probe
   2. readiness probe
   3. liveness probe
2. Shows the images used for every deployment in the cluster across the namespaces.
3. Shows the necessary label details of each image used in deployment.


## Files and folder structure
The folder structure is as follows:

```
  .
  ├── deploy.yaml
  ├── Dockerfile
  ├── ticket.sh
  └── README.md
```

### deploy.yaml
A `cron job` that downloads the docker image from the repository is created by this YAML file. A cron job is created and activated every `1 hour`. The extracted image is executed in a `K8 pod` that is created. The `ticket.sh` script is run by the image. The Pod gracefully exits after doing its task successfully.

### Dockerfile
A Docker image is created by means of this file. 'Debian' is the name of the base image. It also instals the `jq` package, which is used to parse JSON like output. The `ticket.sh` file is also copied inside the container.

### ticket.sh
This is the main script that runs the code.

## How to run

In the root folder

Step 1: Create a Docker image

`docker build -t <image-name>:<image-tag> .`

Step 2: Push the image to Dockerhub

`docker push <image-name>:<image-tag>`

Step 3:
Run the YAML script

`kubectl apply -f deploy.yaml`

This will create a
1. `K8 pod` by the name `mosip-check`
2. `cluster role binding` by the name `mosip-check-role`
3. `service account` by the name `mosip-check-role`

## Checking the output
Once the pod has been marked completed, the result can be checked in the logs of the kubernetes pod.

Check the pod name:

`kubectl get pods`

Check the logs:

`kubectl logs <pod-name>`
# AGENTS.md

Parent guide: [../AGENTS.md](../AGENTS.md)

## Repository Overview

`openssl` is a Docker image that generates a self-signed SSL certificate
using OpenSSL, driven entirely by `entrypoint.sh` and environment
variables passed at `docker run` time.

## Technology Stack

- Docker (`ubuntu:20.04` base image)
- OpenSSL (installed via `apt-get install openssl`)
- bash (`entrypoint.sh`)

## Build & Test Commands

Build the image:

```shell
docker build -t openssl:tagname -f Dockerfile .
```

This folder **is** built by CI: `.github/workflows/push-trigger.yml`
includes `SERVICE_LOCATION: openssl` in its Docker build matrix
(`BASE_IMAGE_BUILD: true`).

Generate a certificate via Docker. Both `README.md` and the example below
bind the volume to a dedicated, empty host directory rather than the
host's real `/etc/ssl` — binding to the host's actual `/etc/ssl` would
let the container overwrite real system certificates, keys, or trust
store, so do not change this back:

```shell
OPENSSL_OUTPUT_DIR="$(pwd)/openssl-output"
mkdir -p "$OPENSSL_OUTPUT_DIR"
docker volume create --name gensslcerts \
  --opt type=none \
  --opt device="$OPENSSL_OUTPUT_DIR" \
  --opt o=bind
```

```shell
docker run -it --mount type=volume,src=gensslcerts,dst=/home/mosip/ssl,volume-driver=local \
  -e VALIDITY=700 \
  -e COUNTRY=IN \
  -e STATE=KAR \
  -e LOCATION=BLR \
  -e ORG=MOSIP \
  -e ORG_UNIT=MOSIP \
  -e COMMON_NAME=*.sandbox.xyz.net \
  mosipdev/openssl:latest
```

There is no automated test suite; validate `entrypoint.sh` changes by
running the container and inspecting the generated certificate/key files.

## Configuration

Environment variables (Dockerfile `ENV` defaults are empty):

- `VALIDITY` — certificate validity in days.
- `COUNTRY`, `STATE`, `LOCATION`, `ORG`, `ORG_UNIT`, `COMMON_NAME` —
  certificate subject fields consumed by `entrypoint.sh`.

## Project Structure Notes

- `entrypoint.sh` — generates the self-signed certificate; the container
  `ENTRYPOINT` is `["/bin/bash","-c","./entrypoint.sh"]`.
- `Dockerfile` — installs `openssl`/`sudo`, creates a non-root `mosip`
  user with passwordless `sudo` (`container_user_uid=1001`), pre-creates
  `$work_dir/ssl/certs` and `$work_dir/ssl/private`, and grants that user
  ownership of `/usr/bin/openssl` and `/etc/ssl/`.
- `README.md` — build/run instructions, including the certificate-volume
  setup used to persist output to a dedicated `OPENSSL_OUTPUT_DIR` on the
  host.

## Development Workflow

1. Edit `entrypoint.sh` directly for certificate-generation logic changes.
2. Since this folder is in the CI Docker-build matrix, confirm
   `docker build -f Dockerfile .` still succeeds after any edit.
3. Test by running the container with the documented volume mount and
   checking the resulting cert/key under `$OPENSSL_OUTPUT_DIR` on the
   host.

## Pull Request Guidelines

- Note the OpenSSL command and output you verified, since there is no
  automated test suite.
- If you add/rename an environment variable, update both `Dockerfile`'s
  `ENV` block and `README.md`'s example `docker run` command together.

## Repository-Specific Considerations

- Inside the image, the container is granted passwordless `sudo` and
  ownership of the container's own `/etc/ssl` — be deliberate about any
  change that widens what `entrypoint.sh` does with that access. The
  host-side volume mount is a separate, dedicated output directory (see
  above), not the host's `/etc/ssl` — do not reintroduce a host `/etc/ssl`
  bind mount.
- Generated certificates/keys are self-signed and intended for
  sandbox/dev use per the README's example (`*.sandbox.xyz.net`) — do not
  present this tool's output as suitable for production TLS without
  saying so explicitly.

## Agent rules

### Do

1. Keep certificate-subject environment variables
   (`VALIDITY`/`COUNTRY`/`STATE`/`LOCATION`/`ORG`/`ORG_UNIT`/`COMMON_NAME`)
   consistent between `Dockerfile`'s `ENV` block and `README.md`'s example.
2. Confirm `docker build -f Dockerfile .` succeeds after edits, since this
   folder is in the CI build matrix.
3. Verify certificate output manually (there is no automated test suite).

### Do not

1. Do not remove the non-root `mosip` user or broaden `sudo` access beyond
   what `entrypoint.sh` needs without calling it out explicitly.
2. Do not present the generated self-signed certificates as
   production-ready TLS material.
3. Do not hardcode subject-field values (`COMMON_NAME`, etc.) into
   `entrypoint.sh` or the `Dockerfile`.

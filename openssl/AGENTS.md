# AGENTS.md

Parent guide: [../AGENTS.md](../AGENTS.md)

## Repository Overview

Docker image generating a self-signed SSL certificate via OpenSSL, driven
entirely by `entrypoint.sh` and env vars passed at `docker run` time.

## Technology Stack

- Docker (`ubuntu:20.04` base), OpenSSL (`apt-get install openssl`), bash
  (`entrypoint.sh`)

## Build & Test Commands

```shell
docker build -t openssl:tagname -f Dockerfile .
```

In CI's Docker build matrix (`push-trigger.yml`, `SERVICE_LOCATION:
openssl`, `BASE_IMAGE_BUILD: true`).

Generate a certificate — bind the volume to a dedicated, empty host
directory, **never** the host's real `/etc/ssl` (would let the container
overwrite real system certs/keys/trust store):

```shell
OPENSSL_OUTPUT_DIR="$(pwd)/openssl-output"
mkdir -p "$OPENSSL_OUTPUT_DIR"
docker volume create --name gensslcerts \
  --opt type=none --opt device="$OPENSSL_OUTPUT_DIR" --opt o=bind

docker run -it --mount type=volume,src=gensslcerts,dst=/home/mosip/ssl,volume-driver=local \
  -e VALIDITY=700 -e COUNTRY=IN -e STATE=KAR -e LOCATION=BLR \
  -e ORG=MOSIP -e ORG_UNIT=MOSIP -e COMMON_NAME=*.sandbox.xyz.net \
  mosipdev/openssl:latest
```

No automated test suite — validate by running the container and inspecting
the generated cert/key, and note what you verified in the PR.

## Configuration

Dockerfile `ENV` defaults are empty:
`VALIDITY`, `COUNTRY`, `STATE`, `LOCATION`, `ORG`, `ORG_UNIT`,
`COMMON_NAME` — certificate subject fields consumed by `entrypoint.sh`.

## Project Structure Notes

- `entrypoint.sh` — generates the cert; `ENTRYPOINT` is
  `["/bin/bash","-c","./entrypoint.sh"]`.
- `Dockerfile` — installs `openssl`/`sudo`, creates a non-root `mosip` user
  with passwordless `sudo` (`container_user_uid=1001`), pre-creates
  `$work_dir/ssl/{certs,private}`, grants that user ownership of
  `/usr/bin/openssl` and `/etc/ssl/`.
- `README.md` — build/run instructions, including the `OPENSSL_OUTPUT_DIR`
  volume setup.

## Development Workflow

1. Edit `entrypoint.sh` directly for cert-generation logic changes.
2. Confirm `docker build -f Dockerfile .` succeeds after edits.
3. Adding/renaming an env var: update the Dockerfile's `ENV` block and
   `README.md`'s example `docker run` together.

## Repository-Specific Considerations

- Container has passwordless `sudo` and owns its own (container-internal)
  `/etc/ssl` — be deliberate about any change widening what
  `entrypoint.sh` does with that access. The host-side mount is a
  dedicated output directory, not the host's `/etc/ssl` — never
  reintroduce a host `/etc/ssl` bind mount.
- Certs are self-signed, sandbox/dev use only (README example:
  `*.sandbox.xyz.net`) — don't present the output as production-ready TLS.

## Agent rules

### Do

1. Keep subject env vars consistent between the Dockerfile `ENV` block and
   `README.md`'s example.
2. Confirm `docker build -f Dockerfile .` succeeds after edits.
3. Verify certificate output manually.

### Do not

1. Remove the non-root `mosip` user or broaden `sudo` access without
   calling it out explicitly.
2. Present the generated certs as production-ready TLS material.
3. Hardcode subject-field values into `entrypoint.sh`/`Dockerfile`.
</content>

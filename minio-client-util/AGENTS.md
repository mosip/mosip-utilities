# AGENTS.md

Parent guide: [../AGENTS.md](../AGENTS.md)

## Repository Overview

`minio-client-util` is a Docker image (no application code, just a
Dockerfile) that uses the MinIO `mc` CLI to delete objects older than a
configured retention window from one or more S3/MinIO buckets. It runs as
a Kubernetes CronJob, deployed via the Helm chart in
`../helm/minio-client-util` and the install script in
`../deploy/minio-client-util`.

## Technology Stack

- Docker (`ubuntu` base image)
- MinIO Client (`mc`), downloaded in the Dockerfile from
  `https://dl.minio.io/client/mc/release/linux-amd64/mc`
- Helm chart for Kubernetes CronJob deployment

## Build & Test Commands

Build the image:

```shell
docker build -t minio-client-util:local -f Dockerfile .
```

This folder **is** built by CI: `.github/workflows/push-trigger.yml`
includes `SERVICE_LOCATION: minio-client-util` in its Docker build matrix
(`BASE_IMAGE_BUILD: true`).

Run it directly against a test bucket:

```shell
sudo docker run -itd \
  -e S3_SERVER_URL='SERVER_URL' \
  -e S3_ACCESS_KEY='ACCESS_KEY' \
  -e S3_SECRET_KEY='SECRET_KEY' \
  -e S3_BUCKET_LIST='bucket-one,bucket-two' \
  -e S3_RETENTION_DAYS='30' \
  minio-client-util:local
```

Deploy/reinstall the CronJob into a cluster:

```shell
../deploy/minio-client-util/install.sh
```

There is no automated test suite; the `CMD` in the Dockerfile is the whole
program, so validate changes by running the container against a scratch
bucket.

## Configuration

Environment variables (Dockerfile `ENV` defaults are empty; set at
`docker run`/Helm-values time):

- `S3_SERVER_URL` — MinIO/S3-compatible endpoint.
- `S3_ACCESS_KEY`, `S3_SECRET_KEY` — credentials with delete permission on
  the target buckets.
- `S3_BUCKET_LIST` — comma-separated bucket names to clean.
- `S3_RETENTION_DAYS` — objects older than this are deleted
  (`mc rm --recursive --force --older-than`).

Never commit real values for `S3_ACCESS_KEY`/`S3_SECRET_KEY`.

## Project Structure Notes

- `Dockerfile` — installs `mc` and its dependencies, then runs the cleanup
  loop directly as the container `CMD` (no separate script file).
- `README.md` — usage instructions (install via CronJob, or run manually
  via Rancher UI/`kubectl`).
- `../deploy/minio-client-util/` — `install.sh`, `delete.sh`,
  `copy_secrets.sh`, and a `README.md` with a screenshot
  (`images/mc-1.png`) showing the Rancher "Run Now" flow.
- `../helm/minio-client-util/` — the Helm chart (`Chart.yaml`,
  `values.yaml`, `templates/configmaps.yaml`, `cronjob.yaml`,
  `secrets.yaml`, `service-account.yaml`).

## Development Workflow

1. Edit the `CMD` shell logic directly in the `Dockerfile` — there is no
   separate script to keep in sync.
2. If you add/rename an environment variable, update
   `../helm/minio-client-util/values.yaml` and
   `../helm/minio-client-util/templates/configmaps.yaml`/`secrets.yaml` in
   the same change.
3. Since this folder is in the CI Docker-build matrix, confirm
   `docker build -f Dockerfile .` still succeeds after any edit.

## Pull Request Guidelines

- Note which bucket/environment you used to validate the `mc rm
  --older-than` behavior, since there is no automated test suite.
- Keep `README.md`'s manual-run instructions (Rancher UI and `kubectl`
  CronJob-to-Job) accurate if you change the CronJob name or namespace in
  the Helm chart.

## Repository-Specific Considerations

- The cleanup command silently continues to the next bucket if
  `mc ls myminio/$S3_BUCKET` fails (bucket missing/empty) — keep that
  fail-open behavior in mind if tightening error handling.
- This deletes real objects irreversibly; never point `S3_BUCKET_LIST` at
  a production bucket while testing changes.

## Agent rules

### Do

1. Keep environment-variable names in the Dockerfile `CMD` in sync with
   `../helm/minio-client-util/values.yaml` and its ConfigMap/Secret
   templates.
2. Confirm `docker build -f Dockerfile .` succeeds after edits, since this
   folder is in the CI build matrix.
3. Test cleanup logic against a scratch bucket before merging.

### Do not

1. Do not hardcode `S3_ACCESS_KEY`/`S3_SECRET_KEY` values.
2. Do not run this utility against a production bucket while testing — it
   permanently deletes objects.
3. Do not remove the fail-open handling for a missing/empty bucket without
   confirming that's an intended behavior change.

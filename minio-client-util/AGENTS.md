# AGENTS.md

Parent guide: [../AGENTS.md](../AGENTS.md)

## Repository Overview

Docker image (no app code, just a Dockerfile) using the MinIO `mc` CLI to
delete objects older than a retention window from S3/MinIO buckets. Runs
as a K8s CronJob (Helm chart in `../helm/minio-client-util`, install
script in `../deploy/minio-client-util`).

## Technology Stack

- Docker (`ubuntu` base), MinIO Client `mc` (downloaded in the Dockerfile
  from `dl.minio.io`)
- Helm chart for K8s CronJob deployment

## Build & Test Commands

```shell
docker build -t minio-client-util:local -f Dockerfile .

sudo docker run -itd \
  -e S3_SERVER_URL='SERVER_URL' \
  -e S3_ACCESS_KEY='ACCESS_KEY' \
  -e S3_SECRET_KEY='SECRET_KEY' \
  -e S3_BUCKET_LIST='bucket-one,bucket-two' \
  -e S3_RETENTION_DAYS='30' \
  minio-client-util:local

../deploy/minio-client-util/install.sh   # deploy/reinstall the CronJob
```

In CI's Docker build matrix (`push-trigger.yml`, `SERVICE_LOCATION:
minio-client-util`, `BASE_IMAGE_BUILD: true`). No automated test suite —
the Dockerfile `CMD` is the whole program; validate by running against a
scratch bucket, and note which bucket/environment you used in the PR.

## Configuration

Dockerfile `ENV` defaults are empty, set at `docker run`/Helm-values time:

- `S3_SERVER_URL` — MinIO/S3-compatible endpoint.
- `S3_ACCESS_KEY`, `S3_SECRET_KEY` — credentials with delete permission on
  the target buckets. Never commit real values.
- `S3_BUCKET_LIST` — comma-separated bucket names to clean.
- `S3_RETENTION_DAYS` — objects older than this are deleted
  (`mc rm --recursive --force --older-than`).

## Project Structure Notes

- `Dockerfile` — installs `mc`, runs the cleanup loop directly as `CMD`
  (no separate script file).
- `README.md` — install via CronJob, or run manually via Rancher UI/`kubectl`.
- `../deploy/minio-client-util/` — `install.sh`, `delete.sh`,
  `copy_secrets.sh`, README with a Rancher "Run Now" screenshot.
- `../helm/minio-client-util/` — Helm chart (`values.yaml`,
  `templates/configmaps.yaml`, `cronjob.yaml`, `secrets.yaml`,
  `service-account.yaml`).

## Development Workflow

1. Edit the `CMD` shell logic directly in the Dockerfile — no separate
   script to keep in sync.
2. Adding/renaming an env var: update `values.yaml` and
   `templates/configmaps.yaml`/`secrets.yaml` together, and keep
   `README.md`'s manual-run instructions (Rancher UI, `kubectl`
   CronJob-to-Job) accurate if the CronJob name/namespace changes.
3. Confirm `docker build -f Dockerfile .` succeeds after edits (CI-built
   folder).

## Repository-Specific Considerations

- The cleanup command silently continues to the next bucket if
  `mc ls myminio/$S3_BUCKET` fails (missing/empty) — keep that fail-open
  behavior in mind before tightening error handling.

## Agent rules

### Do

1. Keep env-var names in the Dockerfile `CMD` synced with `values.yaml`
   and its ConfigMap/Secret templates.
2. Confirm `docker build -f Dockerfile .` succeeds after edits.
3. Test cleanup logic against a scratch bucket before merging.

### Do not

1. Hardcode `S3_ACCESS_KEY`/`S3_SECRET_KEY`.
2. Run against a production bucket while testing — deletion is permanent.
3. Remove the fail-open handling for a missing/empty bucket without
   confirming that's an intended behavior change.
</content>

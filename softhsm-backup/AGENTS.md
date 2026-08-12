# AGENTS.md

Parent guide: [../AGENTS.md](../AGENTS.md)

## Repository Overview

`softhsm-backup` backs up SoftHSM token files from every pod in a given
Kubernetes namespace to S3, and deletes backups older than a configured
retention window. It runs as a Kubernetes CronJob (deployed via the Helm
chart in `../helm/softhsm-backup` and the install script in
`../deploy/softhsm-backup`).

**Known gap, not something documentation alone can fix**: this tool
writes MOSIP token key material to S3 (`main.py`'s `boto3.client('s3', ...)`
uses whatever AWS credentials/region are passed in via env vars, with no
`ServerSideEncryption`/KMS parameter on `upload_file`), and neither
`../helm/softhsm-backup/values.yaml` nor its templates configure TLS
enforcement, server-side encryption/KMS, a scoped-down S3 bucket
policy, or audit logging — the ClusterRole in
`templates/clusterrole.yaml` only covers Kubernetes RBAC (`pods`,
`pods/exec`), not S3 IAM. `delete_old_s3_folders` also has unscoped
`s3:DeleteObject` access to whatever bucket/prefix the deployment's AWS
credentials permit. This needs real infrastructure work (a
least-privilege IAM policy scoped to this CronJob's bucket/prefix, a
bucket policy requiring TLS and enforcing SSE/KMS, and audit logging) —
not something to invent placeholder ARNs/policies for here. Flag this
if asked to review S3/backup security for this repo, and don't assume
these controls exist just because token backups are involved.

## Technology Stack

- Python 3.9 (Dockerfile base: `python:3.9-slim`)
- `boto3` (S3), `kubernetes` (in-cluster pod access via `kubectl cp`),
  `pytz` — see `requirements.txt`
- Docker, deployed as a Kubernetes CronJob via the Helm chart in
  `../helm/softhsm-backup`

## Build & Test Commands

Install dependencies locally:

```shell
pip install -r requirements.txt
```

Build the Docker image:

```shell
docker build -t softhsm-backup:local -f Dockerfile .
```

This folder **is** built by CI: `.github/workflows/push-trigger.yml`
includes `SERVICE_LOCATION: softhsm-backup` in its Docker build matrix
(`BASE_IMAGE_BUILD: true`, `SQUASH_LAYERS: 15`).

Deploy/reinstall the CronJob into a cluster using the install script in
`../deploy/softhsm-backup`:

```shell
../deploy/softhsm-backup/install.sh
```

There is no automated test suite; validate `main.py` changes against a
non-production namespace/bucket.

## Configuration

Environment variables (set as Docker `ENV` defaults, overridden at
`docker run`/Helm-values time):

- `S3_BUCKET` — target bucket (default `s3-bucket-name` — a placeholder,
  not a real bucket).
- `S3_BASE_FOLDER` — S3 prefix for backups (default `softhsmbackup`).
- `NAMESPACE` — Kubernetes namespace to scan for pods (default `softhsm`).
- `POD_TOKENS_PATH` — path inside each pod to copy via `kubectl cp`
  (default `/softhsm/tokens`).
- `S3_RETENTION_DAYS` — days to keep backups before deleting (default
  `15`).
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` — S3
  credentials (default empty; must be supplied at run time, never
  committed).

`main.py` calls `config.load_incluster_config()`, so it expects to run
inside a Kubernetes pod with a service account that can list pods and
`kubectl cp` from the target namespace — it is not meant to run against
`~/.kube/config` locally (the commented-out `load_kube_config()` line is
for local debugging only, not the default path).

## Project Structure Notes

- `main.py` — lists pods in `NAMESPACE`, `kubectl cp`s each pod's
  `POD_TOKENS_PATH` to a local temp folder, uploads it to S3, then deletes
  S3 folders older than `S3_RETENTION_DAYS`.
- `Dockerfile` — installs `kubectl`, sets up a non-root `mosip` user
  (`container_user_uid=1001`), copies the repo, installs
  `requirements.txt`.
- `requirements.txt` — `boto3`, `kubernetes`, `pytz`.
- `../deploy/softhsm-backup/` — `install.sh`/`delete.sh` for the
  Kubernetes CronJob, plus a `README.md`.
- `../helm/softhsm-backup/` — the Helm chart (`Chart.yaml`, `values.yaml`,
  `templates/`) that actually defines the CronJob, ClusterRole/Binding,
  ServiceAccount, ConfigMap, and Secret resources.

## Development Workflow

1. Install `requirements.txt` locally for editing/linting `main.py`.
2. If you change environment variables `main.py` reads, update the
   matching defaults in `Dockerfile`'s `ENV` block and
   `../helm/softhsm-backup/values.yaml` together.
3. Since this folder is in the CI Docker-build matrix, confirm
   `docker build -f Dockerfile .` still succeeds after dependency or
   `WORKDIR` changes.
4. Test `main.py` changes against a scratch namespace/S3 bucket — it
   deletes real S3 objects once run.

## Pull Request Guidelines

- If you touch environment variables or the retention logic, update this
  file, `../deploy/softhsm-backup/README.md`, and
  `../helm/softhsm-backup/values.yaml` in the same PR so they stay
  consistent.
- Note which namespace/bucket you validated against, since there is no
  automated test suite.

## Repository-Specific Considerations

- `delete_old_s3_folders` parses folder names as
  `...-DD-MM-YY-HH-MM-UTC` to determine age; changing the date-format
  string used when uploading (`current_date = ...strftime(...)`) without
  updating the parser will silently break retention cleanup.
- The container needs a Kubernetes RBAC role with permission to list pods
  and exec `kubectl cp` in `NAMESPACE` — see
  `../helm/softhsm-backup/templates/clusterrole.yaml` /
  `clusterrolebinding.yaml` for the granted permissions before changing
  what `main.py` accesses.

## Agent rules

### Do

1. Keep `main.py`'s environment-variable names in sync with
   `Dockerfile`'s `ENV` defaults and `../helm/softhsm-backup/values.yaml`.
2. Confirm `docker build -f Dockerfile .` succeeds after changes, since
   this folder is in the CI build matrix.
3. Validate retention/date-parsing changes against a scratch S3
   bucket/namespace before merging.

### Do not

1. Do not hardcode `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` or a real
   `S3_BUCKET` name in source, `Dockerfile`, or Helm values.
2. Do not run `main.py` against a production namespace or bucket while
   testing — it deletes S3 objects older than `S3_RETENTION_DAYS`.
3. Do not change the backup folder date-naming format without updating
   `delete_old_s3_folders`'s parsing logic to match.

# AGENTS.md

Parent guide: [../AGENTS.md](../AGENTS.md)

## Repository Overview

Backs up SoftHSM token files from every pod in a K8s namespace to S3,
deletes backups older than a retention window. Runs as a K8s CronJob
(Helm chart in `../helm/softhsm-backup`, install script in
`../deploy/softhsm-backup`).

**Known security gap — not fixable via docs alone**: writes MOSIP token
key material to S3 with no `ServerSideEncryption`/KMS on `main.py`'s
`upload_file` call, and neither `values.yaml` nor its templates configure
TLS enforcement, SSE/KMS, a scoped-down bucket policy, or audit logging
(`clusterrole.yaml` only covers K8s RBAC, not S3 IAM). `delete_old_s3_folders`
also has unscoped `s3:DeleteObject` on whatever bucket/prefix the deployment
credentials allow. Needs real infra work (least-privilege IAM scoped to
this CronJob's bucket/prefix, a TLS+SSE/KMS bucket policy, audit logging)
— don't invent placeholder ARNs/policies here. Flag if asked to review S3/
backup security; don't assume these controls exist just because tokens are
involved.

## Technology Stack

- Python 3.9 (`python:3.9-slim` base)
- `boto3` (S3), `kubernetes` (in-cluster pod access via `kubectl cp`),
  `pytz` — see `requirements.txt`

## Build & Test Commands

```shell
pip install -r requirements.txt
docker build -t softhsm-backup:local -f Dockerfile .
../deploy/softhsm-backup/install.sh   # deploy/reinstall the CronJob
```

In CI's Docker build matrix (`push-trigger.yml`, `SERVICE_LOCATION:
softhsm-backup`, `BASE_IMAGE_BUILD: true`, `SQUASH_LAYERS: 15`). No
automated test suite — validate `main.py` against a non-production
namespace/bucket.

## Configuration

Docker `ENV` defaults, overridden at `docker run`/Helm-values time:

- `S3_BUCKET` — target bucket (default `s3-bucket-name`, a placeholder).
- `S3_BASE_FOLDER` — S3 prefix (default `softhsmbackup`).
- `NAMESPACE` — K8s namespace to scan (default `softhsm`).
- `POD_TOKENS_PATH` — path to `kubectl cp` from each pod (default
  `/softhsm/tokens`).
- `S3_RETENTION_DAYS` — days before deletion (default `15`).
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` — S3
  credentials (empty by default; supply at run time, never commit).

`main.py` uses `config.load_incluster_config()` — expects to run inside a
pod with a service account that can list pods and `kubectl cp` in the
target namespace, not against a local `~/.kube/config` (the commented-out
`load_kube_config()` is local-debug only).

## Project Structure Notes

- `main.py` — lists pods in `NAMESPACE`, `kubectl cp`s each pod's
  `POD_TOKENS_PATH` to a local temp folder, uploads to S3, deletes S3
  folders older than `S3_RETENTION_DAYS`.
- `Dockerfile` — installs `kubectl`, non-root `mosip` user
  (`container_user_uid=1001`), installs `requirements.txt`.
- `../deploy/softhsm-backup/` — `install.sh`/`delete.sh` + README.
- `../helm/softhsm-backup/` — the Helm chart defining the CronJob,
  ClusterRole/Binding, ServiceAccount, ConfigMap, Secret.

## Development Workflow

1. `pip install -r requirements.txt` for local editing/linting.
2. If you change an env var `main.py` reads, update `Dockerfile`'s `ENV`
   and `../helm/softhsm-backup/values.yaml` together — and mention it plus
   which namespace/bucket you tested against in the PR.
3. Confirm `docker build -f Dockerfile .` succeeds after dependency/
   `WORKDIR` changes (CI-built folder).
4. Test against a scratch namespace/S3 bucket — real objects get deleted.

## Repository-Specific Considerations

- `delete_old_s3_folders` parses folder names as `...-DD-MM-YY-HH-MM-UTC`
  for age — changing the upload `strftime` format without updating the
  parser silently breaks retention cleanup.
- Pod-list/`kubectl cp` access is granted via
  `../helm/softhsm-backup/templates/clusterrole.yaml`/
  `clusterrolebinding.yaml` — check there before changing what `main.py`
  accesses.

## Agent rules

### Do

1. Keep `main.py` env-var names in sync with `Dockerfile`'s `ENV` and
   `values.yaml`.
2. Confirm `docker build -f Dockerfile .` succeeds after changes.
3. Validate retention/date-parsing changes against a scratch bucket.

### Do not

1. Hardcode AWS credentials or a real `S3_BUCKET` name anywhere.
2. Run `main.py` against a production namespace/bucket while testing.
3. Change the backup date-naming format without updating
   `delete_old_s3_folders`'s parser to match.
</content>

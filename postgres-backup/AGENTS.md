# AGENTS.md

Parent guide: [../AGENTS.md](../AGENTS.md)

## Repository Overview

`postgres-backup` is a Docker image that dumps a PostgreSQL database
(`pg_dumpall`) and streams it directly to S3, then prunes S3 backups
beyond a configured retention count. All logic lives in
`backup_script.sh`, which is the container's `CMD`.

## Technology Stack

- Docker (`postgres:15` base image, so `pg_dumpall`/`pg_dump` tooling
  matches Postgres 15 client libraries)
- AWS CLI v2 (installed in the Dockerfile from
  `https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip`)
- bash (`backup_script.sh`, run with `set -e -o nounset -o pipefail
  -o errtrace`)

## Build & Test Commands

Build the image:

```shell
docker build -t postgres-backup:local -f Dockerfile .
```

This folder **is** built by CI: `.github/workflows/push-trigger.yml`
includes `SERVICE_LOCATION: postgres-backup` in its Docker build matrix
(`BASE_IMAGE_BUILD: true`, `SQUASH_LAYERS: 18`).

Run against a test database/bucket:

```shell
docker run --rm \
  -e DB_USER='postgres' \
  -e DB_HOST='db-host' \
  -e DB_PORT='5432' \
  -e DB_PASSWORD='db-password' \
  -e S3_BUCKET='scratch-bucket' \
  -e S3_FOLDER='postgresbackup' \
  -e NUM_BACKUPS_TO_KEEP='5' \
  -e EXPECTED_SIZE='1073741824000' \
  -e AWS_ACCESS_KEY_ID='key' \
  -e AWS_SECRET_ACCESS_KEY='secret' \
  -e AWS_DEFAULT_REGION='region' \
  postgres-backup:local
```

`backup_script.sh` can also be shellchecked/run directly on a machine with
`pg_dumpall` and the AWS CLI installed. There is no automated test suite.

## Configuration

Environment variables (Dockerfile `ENV` provides defaults for some,
credentials default empty):

- `DB_USER` (default `postgres`), `DB_HOST` (default empty), `DB_PORT`
  (default `5432`), `DB_PASSWORD` (default empty).
- `S3_BUCKET` (default `s3-bucket-name` placeholder), `S3_FOLDER` (default
  `postgresbackup`).
- `NUM_BACKUPS_TO_KEEP` (default `5`) — number of most recent backups kept
  in S3; older ones are deleted after a successful upload.
- `EXPECTED_SIZE` (default `1073741824000` bytes) — passed to
  `aws s3 cp --expected-size` for the streamed upload.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`
  (default empty) — must be supplied at run time.

## Project Structure Notes

- `backup_script.sh` — the entire program: pipes `pg_dumpall` output
  straight into `aws s3 cp - s3://.../BACKUP_FILE`, then lists, sorts, and
  deletes S3 objects beyond `NUM_BACKUPS_TO_KEEP`.
- `Dockerfile` — installs AWS CLI v2, creates a non-root `mosip` user
  (`container_user_uid=1001`), copies and `chmod +x`s the script, sets it
  as `CMD`.
- `README.md` — one-line description; the operational detail lives in
  `backup_script.sh` and this `AGENTS.md`.

## Development Workflow

1. Edit `backup_script.sh` directly — there is no separate config file.
2. Preserve `set -e -o nounset -o pipefail -o errtrace` at the top; the
   retention-cleanup loop relies on the script exiting on the first
   failure of the dump/upload step (the explicit `$?` check after the
   pipe).
3. Since this folder is in the CI Docker-build matrix, confirm
   `docker build -f Dockerfile .` still succeeds after any edit.

## Pull Request Guidelines

- Note which database/bucket you validated the dump-and-prune flow
  against, since there is no automated test suite.
- If you change `NUM_BACKUPS_TO_KEEP`/`EXPECTED_SIZE` defaults, update
  both the `Dockerfile`'s `ENV` block and this file together.

## Repository-Specific Considerations

- The backup filename embeds a UTC timestamp
  (`$S3_FOLDER-$DATE.dump`); the retention-cleanup step sorts S3 listing
  output with `sort -r` and deletes everything past
  `NUM_BACKUPS_TO_KEEP` — changing the filename format can break the sort
  order the cleanup relies on.
- `pg_dumpall` requires a role with sufficient privileges to dump all
  databases/roles on the target server; do not point this at a
  production Postgres instance while testing script changes.

## Agent rules

### Do

1. Keep `set -e -o nounset -o pipefail -o errtrace` and the post-pipe `$?`
   check intact when editing `backup_script.sh`.
2. Confirm `docker build -f Dockerfile .` succeeds after edits, since this
   folder is in the CI build matrix.
3. Validate dump/upload/prune behavior against a scratch database and
   bucket.

### Do not

1. Do not hardcode `DB_PASSWORD`, `AWS_ACCESS_KEY_ID`, or
   `AWS_SECRET_ACCESS_KEY`.
2. Do not run this script against a production database or bucket while
   testing — it deletes S3 objects beyond `NUM_BACKUPS_TO_KEEP`.
3. Do not change the backup filename's date format without checking the
   retention `sort -r`/deletion logic still keeps the newest files.

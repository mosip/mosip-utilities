# AGENTS.md

Parent guide: [../AGENTS.md](../AGENTS.md)

## Repository Overview

Docker image that dumps a PostgreSQL DB (`pg_dumpall`) straight to S3, then
prunes S3 backups beyond a retention count. All logic is in
`backup_script.sh`, the container's `CMD`.

## Technology Stack

- Docker (`postgres:15` base — matches Postgres 15 client tooling)
- AWS CLI v2 (installed in the Dockerfile)
- bash (`backup_script.sh`, `set -e -o nounset -o pipefail -o errtrace`)

## Build & Test Commands

```shell
docker build -t postgres-backup:local -f Dockerfile .

docker run --rm \
  -e DB_USER='postgres' -e DB_HOST='db-host' -e DB_PORT='5432' \
  -e DB_PASSWORD='db-password' -e S3_BUCKET='scratch-bucket' \
  -e S3_FOLDER='postgresbackup' -e NUM_BACKUPS_TO_KEEP='5' \
  -e EXPECTED_SIZE='1073741824000' -e AWS_ACCESS_KEY_ID='key' \
  -e AWS_SECRET_ACCESS_KEY='secret' -e AWS_DEFAULT_REGION='region' \
  postgres-backup:local
```

`backup_script.sh` can also be shellchecked/run directly with `pg_dumpall`
and the AWS CLI installed. In CI's Docker build matrix (`push-trigger.yml`,
`SERVICE_LOCATION: postgres-backup`, `BASE_IMAGE_BUILD: true`,
`SQUASH_LAYERS: 18`). No automated test suite — note which database/bucket
you validated against in the PR.

## Configuration

- `DB_USER` (default `postgres`), `DB_HOST`/`DB_PASSWORD` (default empty),
  `DB_PORT` (default `5432`).
- `S3_BUCKET` (default `s3-bucket-name` placeholder), `S3_FOLDER` (default
  `postgresbackup`).
- `NUM_BACKUPS_TO_KEEP` (default `5`) — most recent backups kept in S3;
  older deleted after a successful upload.
- `EXPECTED_SIZE` (default `1073741824000` bytes) — passed to
  `aws s3 cp --expected-size` for the streamed upload.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`
  (default empty) — supply at run time.

## Project Structure Notes

- `backup_script.sh` — pipes `pg_dumpall` into
  `aws s3 cp - s3://.../BACKUP_FILE`, then lists/sorts/deletes S3 objects
  beyond `NUM_BACKUPS_TO_KEEP`.
- `Dockerfile` — installs AWS CLI v2, non-root `mosip` user
  (`container_user_uid=1001`), sets the script as `CMD`.
- `README.md` — one-liner; operational detail lives in `backup_script.sh`
  and this file.

## Development Workflow

1. Edit `backup_script.sh` directly — no separate config file.
2. Preserve `set -e -o nounset -o pipefail -o errtrace` and the post-pipe
   `$?` check — the retention loop relies on exiting on first dump/upload
   failure.
3. Confirm `docker build -f Dockerfile .` succeeds after edits.
4. Changing `NUM_BACKUPS_TO_KEEP`/`EXPECTED_SIZE` defaults: update the
   Dockerfile's `ENV` block and this file together.

## Repository-Specific Considerations

- Filename embeds a UTC timestamp (`$S3_FOLDER-$DATE.dump`); the cleanup
  step `sort -r`s the S3 listing and deletes past `NUM_BACKUPS_TO_KEEP` —
  changing the filename format can break that sort order.
- `pg_dumpall` needs a role with dump-everything privileges — don't point
  this at a production Postgres instance while testing.

## Agent rules

### Do

1. Keep `set -e -o nounset -o pipefail -o errtrace` and the post-pipe `$?`
   check intact.
2. Confirm `docker build -f Dockerfile .` succeeds after edits.
3. Validate dump/upload/prune against a scratch database and bucket.

### Do not

1. Hardcode `DB_PASSWORD`, `AWS_ACCESS_KEY_ID`, or `AWS_SECRET_ACCESS_KEY`.
2. Run against a production database/bucket while testing.
3. Change the filename's date format without checking the `sort -r`/
   deletion logic still keeps the newest files.
</content>

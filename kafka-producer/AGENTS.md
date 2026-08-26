# AGENTS.md

Parent guide: [../AGENTS.md](../AGENTS.md)

## Repository Overview

Python tool publishing packet/RID records onto a Kafka topic, reading input
from a CSV file or a database via `src/db.py`, publishing with
`kafka-python`. Runs via `pipenv` or as a Docker image.

## Technology Stack

- Python 3.10 (`Pipfile`'s `[requires]`), `pipenv` for deps
- Key libs: `kafka-python`, `pandas`, `python-dotenv`, `requests`
- Docker (`python:3.10-slim-buster` base)

## Build & Test Commands

```shell
pipenv install
pipenv run python kafka_producer.py
docker build -t kafka-producer:local -f Dockerfile .
```

`run.bat` invokes `healthreport.py`, which doesn't exist here — stale,
needs fixing; use `pipenv run python kafka_producer.py` instead. Mention in
the PR if you fixed or knowingly left it.

This folder **is** in CI's Docker build matrix
(`push-trigger.yml`, `SERVICE_LOCATION: kafka-producer`, `BASE_IMAGE_BUILD:
false`, via `mosip/kattu`). No automated test suite — validate by running
against a non-production Kafka topic and note what you validated in the PR.

## Configuration

Read from env vars via `src/config.py`/`os.getenv`, loaded through
`python-dotenv` from a path in `src/utils/app_path.py`:

- `db_host`, `db_port`, `db_user`, `db_pass` — source DB connection.
- `logger_level` — logging verbosity.
- `output_topic` — Kafka topic to publish to.

No defaults in source — supply via untracked local `.env` or container env
vars. Never commit a populated `.env`.

## Project Structure Notes

- `kafka_producer.py` — entry point; builds/publishes messages via a
  `MyThread` worker per record.
- `src/config.py` — env-backed config. `src/db.py` — DB access for records
  to publish. `src/utils/` — CSV/date/file/JSON/logging/path helpers.
- `src/__pycache__/`, `src/utils/__pycache__/` — stale compiled bytecode
  checked into the tree; not source, don't re-add fresh output.

## Development Workflow

1. `pipenv install` before making changes.
2. Declare new deps in `Pipfile` and regenerate `Pipfile.lock` — don't
   install ad hoc.
3. Confirm `docker build -f Dockerfile .` still succeeds after dependency
   changes (this folder is CI-built).

## Repository-Specific Considerations

- Dockerfile runs as non-root `mosip` (`container_user_uid=1001`) via
  `pipenv install --system --deploy --ignore-pipfile` — keep
  `Pipfile.lock` in sync so `--deploy` doesn't fail on a stale lock.
- Never commit real Kafka bootstrap servers, DB credentials, or `.env`
  files containing them.

## Agent rules

### Do

1. Declare new deps in `Pipfile`, keep `Pipfile.lock` in sync.
2. Confirm `docker build -f Dockerfile .` succeeds after dependency/
   `WORKDIR` changes.

### Do not

1. Commit `.env` files, hardcoded credentials, or new `__pycache__` output.
</content>

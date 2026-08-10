# AGENTS.md

Parent guide: [../AGENTS.md](../AGENTS.md)

## Repository Overview

`kafka-producer` is a Python tool that publishes packet/RID records onto a
Kafka topic, reading input from a CSV file or a database via `src/db.py`
and using `kafka-python` to publish. It is packaged as a Docker image and
also runnable directly with `pipenv`.

## Technology Stack

- Python 3.10 (pinned in `Pipfile`'s `[requires]`)
- `pipenv` for dependency management (`Pipfile` / `Pipfile.lock`)
- Key libraries: `kafka-python`, `pandas`, `python-dotenv`, `requests`
- Docker (`python:3.10-slim-buster` base image)

## Build & Test Commands

Install dependencies locally with pipenv:

```shell
pipenv install
```

Run the producer:

```shell
pipenv run python kafka_producer.py
```

`run.bat` in this folder currently invokes `healthreport.py`, which does
not exist in this folder — treat `run.bat` as stale/needs-fixing rather
than a working entry point; use `pipenv run python kafka_producer.py`
instead until it is corrected.

Build the Docker image:

```shell
docker build -t kafka-producer:local -f Dockerfile .
```

This folder **is** built by CI: `.github/workflows/push-trigger.yml`
includes `SERVICE_LOCATION: kafka-producer` in its Docker build matrix
(`BASE_IMAGE_BUILD: false`), so a PR touching this folder triggers an image
build via the reusable `mosip/kattu` workflow.

There is no automated test suite in this folder; validate changes by
running the script against a non-production Kafka topic.

## Configuration

Configuration is read from environment variables via `src/config.py` and
`os.getenv`, loaded through `python-dotenv` (`load_dotenv`) from an
env-file path defined in `src/utils/app_path.py`:

- `db_host`, `db_port`, `db_user`, `db_pass` — source database connection.
- `logger_level` — logging verbosity.
- `output_topic` — Kafka topic to publish to (read directly via
  `os.getenv("output_topic")` in `kafka_producer.py`).

None of these are given defaults in source — supply them via a local
`.env` file (untracked) or container environment variables. Do not commit
a populated `.env` file.

## Project Structure Notes

- `kafka_producer.py` — entry point; builds and publishes messages using a
  `MyThread` worker per record.
- `src/config.py` — environment-variable-backed configuration.
- `src/db.py` — database access for pulling records to publish.
- `src/utils/` — CSV, date, file, JSON, logging, and path helpers.
- `src/__pycache__/`, `src/utils/__pycache__/` — compiled bytecode checked
  into the tree from a prior run; do not treat these as source, and avoid
  re-adding fresh `__pycache__` output in new commits.

## Development Workflow

1. Use `pipenv install` to get a matching environment before making
   changes.
2. Keep new dependencies declared in `Pipfile` (and regenerate
   `Pipfile.lock`) rather than installing ad hoc.
3. Since this folder is in the CI Docker-build matrix, make sure
   `docker build -f Dockerfile .` still succeeds after dependency changes.

## Pull Request Guidelines

- Call out in the PR if you fixed or intentionally left `run.bat` pointing
  at the non-existent `healthreport.py`.
- Mention what topic/environment you validated message publishing against,
  since there is no automated test suite here.

## Repository-Specific Considerations

- The Dockerfile runs as a non-root `mosip` user (`container_user_uid=1001`)
  with `pipenv install --system --deploy --ignore-pipfile` — keep
  `Pipfile.lock` in sync with `Pipfile` so `--deploy` (which fails on a
  stale lock file) keeps working.
- Never commit real Kafka bootstrap servers, DB credentials, or `.env`
  files containing them.

## Agent rules

### Do

1. Declare new Python dependencies in `Pipfile` and keep `Pipfile.lock` in
   sync.
2. Confirm `docker build -f Dockerfile .` succeeds after any dependency or
   `WORKDIR`-affecting change, since this folder is in the CI build matrix.
3. Point out `run.bat`'s reference to a missing `healthreport.py` if asked
   to touch that file, rather than silently leaving broken guidance.

### Do not

1. Do not commit `.env` files or hardcode `db_pass`, Kafka bootstrap
   servers, or other credentials in `kafka_producer.py`/`src/config.py`.
2. Do not commit new `__pycache__` output.
3. Do not assume there is an automated test suite here — there is none.

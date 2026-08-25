# AGENTS.md

Parent guide: [../AGENTS.md](../AGENTS.md)

## Repository Overview

`packet-extractor` compares MOSIP registration packet data against
ID-Repository data, either for a list of RIDs given in a CSV file or for
all RIDs in a given date range. It calls the auth-manager, ID-Repository,
and packet-manager HTTP APIs and reads directly from the registration
processor database, then writes an Excel report of the comparison.

## Technology Stack

- Python 3.10 (pinned in `Pipfile`'s `[requires]`)
- `pipenv` for dependency management
- Key libraries: `requests`, `psycopg2-binary` (Postgres), `openpyxl`
  (xlsx output), `pandas`, `python-dotenv`

## Build & Test Commands

Install OS packages and pipenv dependencies (`preinstall.sh` installs
Python 3.10, pip, and pipenv via `apt`/`sudo`, then installs the same
libraries pipenv-style):

```shell
./preinstall.sh
```

Create working directories, then run for a file-based RID list or a
date-range query. Use `pipenv run`, not `sudo python3` — `sudo python3`
starts a new process, not a new shell, and that process isn't inside the
`pipenv` virtualenv, so it would resolve to the system interpreter and
skip every `Pipfile` dependency (`psycopg2-binary`, `pandas`, etc.); it
would also run the whole tool — which handles registration-processor DB
credentials and MOSIP registration RIDs — as root for no reason this
utility needs:

```shell
mkdir .venv logs output
pipenv run python ./main.py --file
```

```shell
pipenv run python ./main.py --db
```

This folder is **not** in `.github/workflows/push-trigger.yml`'s Docker
build matrix and has no other CI workflow — there is no automated build or
test for it; validate changes by running against a non-production
environment.

## Configuration

All configuration lives in `config.py` (edited directly, not via
environment variables):

- `auth_server_url` — auth-manager base URL.
- `identity_server_url` — ID-Repository base URL.
- `pkt_mgr_server_url` — packet-manager base URL.
- `db_host`, `db_port`, `db_user`, `db_pass` — registration-processor
  database connection.
- `regproc_secret_key` — `mosip-regproc-client` secret.
- `start_date`, `end_date` — date range (`YYYYMMDD`) used in `--db` mode.

Because these are literal values in a tracked `.py` file rather than
environment variables, never commit real secrets/URLs into `config.py` —
keep placeholder values in version control and let operators fill in real
ones locally before running.

## Project Structure Notes

- `main.py` — CLI entry point, dispatches to `--file` or `--db` mode.
- `distinctentries.py` — supporting comparison logic.
- `config.py` — all configuration (see above).
- `utils/` — CSV, DB, DB-helper, file, JSON, logging, path, and session
  helpers.
- `resource/template.xlsx` — template used for the generated report.
- Runtime-created `input/`, `logs/`, `output/`, `.venv/` directories are
  not part of the tracked source tree — do not assume they exist until
  created per the run instructions above.

## Development Workflow

1. Run `./preinstall.sh` (or install the pinned `Pipfile` dependencies via
   pipenv) before making changes.
2. Keep `config.py`'s tracked defaults as placeholders — do not fill in
   real server URLs, DB credentials, or the `regproc_secret_key`.
3. Since there is no CI or automated test suite, manually run both
   `--file` and `--db` modes against a test environment when changing
   comparison logic in `main.py`/`distinctentries.py`.

## Pull Request Guidelines

- Describe which mode(s) (`--file`, `--db`) you validated the change
   against, since there is no automated coverage.
- If you change `config.py`'s shape (new required field), update
  `Readme.md`'s "Config" section in the same PR.

## Repository-Specific Considerations

- `main.py` is run via `pipenv run python`, not `sudo` — `Readme.md` and
  this guide were both updated to drop `sudo` since it broke the pipenv
  virtualenv (see Build & Test Commands above); do not reintroduce it.
- This tool reads production-shaped RID/packet data; run it against
  staging/test data, not a live production DB, while iterating.

## Agent rules

### Do

1. Keep `config.py`'s committed values as placeholders, never real
   URLs/credentials.
2. Manually validate both `--file` and `--db` modes when changing shared
   logic, since there is no CI here.
3. Update `Readme.md` alongside any change to `config.py`'s required
   fields or the `main.py` CLI flags.

### Do not

1. Do not commit real `db_pass`, `regproc_secret_key`, or server URLs into
   `config.py`.
2. Do not assume this folder has CI coverage — it is absent from both
   workflow files in `.github/workflows`.
3. Do not run this tool against a production database while testing.

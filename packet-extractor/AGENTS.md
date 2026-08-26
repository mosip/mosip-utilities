# AGENTS.md

Parent guide: [../AGENTS.md](../AGENTS.md)

## Repository Overview

Compares MOSIP registration packet data against ID-Repository data, for a
CSV list of RIDs or all RIDs in a date range. Calls auth-manager,
ID-Repository, and packet-manager HTTP APIs plus reads directly from the
registration processor DB; writes an Excel comparison report.

## Technology Stack

- Python 3.10 (`Pipfile`'s `[requires]`), pipenv
- Key libs: `requests`, `psycopg2-binary`, `openpyxl`, `pandas`,
  `python-dotenv`

## Build & Test Commands

`preinstall.sh` installs Python 3.10/pip/pipenv via `apt`/`sudo`, then the
`Pipfile` deps:

```shell
./preinstall.sh
mkdir .venv logs output
pipenv run python ./main.py --file   # file-based RID list
pipenv run python ./main.py --db     # date-range query
```

Use `pipenv run`, not `sudo python3` — `sudo python3` starts a new process
outside the pipenv virtualenv, resolving to the system interpreter (skips
every `Pipfile` dep) and running as root for no reason this tool needs.

Not in CI's Docker build matrix or any other workflow — no automated
build/test. Validate by running `--file` and `--db` against a
non-production environment, and say which you validated in the PR.

## Configuration

All in `config.py` (literal values, not env vars) — never commit real
values, keep placeholders in version control:

- `auth_server_url`, `identity_server_url`, `pkt_mgr_server_url` — service
  base URLs.
- `db_host`, `db_port`, `db_user`, `db_pass` — registration-processor DB.
- `regproc_secret_key` — `mosip-regproc-client` secret.
- `start_date`, `end_date` (`YYYYMMDD`) — date range for `--db` mode.

## Project Structure Notes

- `main.py` — CLI entry, dispatches to `--file`/`--db`.
- `distinctentries.py` — comparison logic. `config.py` — all config.
- `utils/` — CSV/DB/file/JSON/logging/path/session helpers.
- `resource/template.xlsx` — report template.
- `input/`, `logs/`, `output/`, `.venv/` are runtime-created, not tracked —
  don't assume they exist before running.

## Development Workflow

1. Run `./preinstall.sh` before making changes.
2. Manually run both `--file` and `--db` modes against a test environment
   when changing `main.py`/`distinctentries.py` — no CI/tests exist.
3. Update `Readme.md`'s "Config" section alongside any `config.py`
   shape/CLI-flag change.

## Repository-Specific Considerations

- Reads production-shaped RID/packet data — run against staging/test data,
  never a live production DB, while iterating.

## Agent rules

### Do

1. Keep `config.py`'s committed values as placeholders.
2. Manually validate both `--file` and `--db` modes for shared-logic
   changes.

### Do not

1. Commit real `db_pass`, `regproc_secret_key`, or server URLs.
2. Run this tool against a production database while testing.
</content>

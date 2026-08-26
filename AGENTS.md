# AGENTS.md

## Repository Overview

`mosip-utilities` is a collection of small, independent debugging/operational
tools used by the MOSIP team across MOSIP deployments. Each top-level folder
is a standalone tool with its own `README.md` (or, in
`biometricVariationGenerator`'s subfolders, `ReadMe.MD` — check exact casing)
and its own stack (Java/Maven, Python, or plain Dockerfile/shell). No shared
build system, source tree, or runtime.

The root README says this repo "should remain private" and private utilities
must not publish Docker images/artifacts — check whether a utility is meant
to be public before wiring up release/publish behavior. **Already in
tension with CI**: `.github/workflows/chart-lint-publish.yml` publishes
`helm/**` charts to the public `https://mosip.github.io/mosip-helm` on
release (or manual `workflow_dispatch` with `CHART_PUBLISH=YES`) — a real,
pre-existing exception, not precedent to extend. Flag this if asked to touch
chart-publishing; don't add a second public path for a private utility.

This file is a hub — each utility with its own build/run story has its own
`AGENTS.md`; read the one for the folder you're working in.

### Module index

| Folder | What it is | Stack | Guide |
|---|---|---|---|
| `id-repository-credentials-feeder` | Spring Batch job requesting ID-Repository credentials for a list of partners | Java 11 / Maven / Spring Boot | [AGENTS.md](id-repository-credentials-feeder/AGENTS.md) |
| `kafka-producer` | Publishes packet/RID data to a Kafka topic from CSV/DB input | Python 3.10 / pipenv | [AGENTS.md](kafka-producer/AGENTS.md) |
| `packet-extractor` | Compares registration packet data against ID Repository for a list/date range of RIDs | Python 3.10 / pipenv | [AGENTS.md](packet-extractor/AGENTS.md) |
| `softhsm-backup` | Backs up SoftHSM tokens from K8s pods to S3, prunes old backups | Python 3.9 / Docker / Helm | [AGENTS.md](softhsm-backup/AGENTS.md) |
| `minio-client-util` | Deletes objects older than a retention window from S3/MinIO | Docker (`mc`) / Helm | [AGENTS.md](minio-client-util/AGENTS.md) |
| `postgres-backup` | Dumps a PostgreSQL DB to S3, prunes old backups | Docker / bash / AWS CLI | [AGENTS.md](postgres-backup/AGENTS.md) |
| `openssl` | Generates self-signed SSL certs in a container | Docker / OpenSSL / bash | [AGENTS.md](openssl/AGENTS.md) |
| `biometricVariationGenerator` | Three standalone Java programs generating face/finger/iris image variations for test data | Plain Java (no build file) | [AGENTS.md](biometricVariationGenerator/AGENTS.md) |
| `alpine`, `openjdk/17-jre`, `openjdk/21-jre`, `openjdk/21-jdk` | Base Docker images for other MOSIP services | Dockerfile only | see below |
| `deploy/<name>`, `helm/<name>` | Install scripts / Helm charts for `minio-client-util` and `softhsm-backup` K8s CronJobs | bash / Helm | covered in that utility's guide |

`deploy/` and `helm/` aren't independent modules — each subfolder belongs to
a same-named utility above and is documented there, not duplicated here.

### Base images

`alpine/`, `openjdk/17-jre/`, `openjdk/21-jre/`, `openjdk/21-jdk/`
Dockerfiles are minimal, single-purpose, no README/scripts. Plain
`docker build`:

```shell
docker build -t openjdk-21-jre:local -f openjdk/21-jre/Dockerfile openjdk/21-jre
```

## Technology Stack

- Java 11 + Maven + Spring Boot/Batch (`id-repository-credentials-feeder`)
- Plain Java, no build file (`biometricVariationGenerator/*`)
- Python 3.9/3.10, pipenv or `pip -r requirements.txt` (`kafka-producer`,
  `packet-extractor`, `softhsm-backup`)
- Docker + bash, no app code (`minio-client-util`, `postgres-backup`,
  `openssl`, base images)
- Helm charts for K8s CronJobs (`helm/minio-client-util`, `helm/softhsm-backup`)

No root `pom.xml`/`package.json`/workspace config — don't add one without
confirming every module still builds independently (MOSIP CI treats each as
a separate matrix entry).

## Build & Test Commands

No repo-wide build; build/test each utility from its own folder per that
utility's `AGENTS.md`. CI is the only thing spanning folders:

- `push-trigger.yml` builds Docker images (reusable `mosip/kattu` workflow)
  on push/PR/release for exactly: `kafka-producer`, `minio-client-util`,
  `openssl`, `openjdk/17-jre`, `openjdk/21-jre`, `alpine`, `openjdk/21-jdk`,
  `softhsm-backup`, `postgres-backup`. **Not** covered:
  `id-repository-credentials-feeder`, `packet-extractor`,
  `biometricVariationGenerator` — verify those manually.
- `chart-lint-publish.yml` lints, and on release publishes, `helm/**`.

Don't claim "CI covers this" for a folder unless it's actually in one of
those two workflows' scope — verify against the workflow files, not memory.

## Configuration

Each utility configures via its own env vars, Dockerfile `ENV` defaults, JVM
`-D` properties, or `config.py`/`.env` — no shared mechanism. Never commit
real S3 keys, DB passwords, kubeconfigs, or partner IDs; Dockerfiles ship
credential-shaped `ENV` vars (`S3_ACCESS_KEY`, `AWS_SECRET_ACCESS_KEY`,
`DB_PASSWORD`, etc.) empty, supplied at `docker run`/Helm-values time. See
each module's guide for its exact variable list.

## Project Structure Notes

- Folder = unit of independence: Dockerfile, scripts, README all live inside
  one top-level folder.
- `deploy/<name>` / `helm/<name>` extend a same-named utility with K8s
  install scripts / Helm charts — not separate tools.
- `biometricVariationGenerator` contains three unrelated tools (`face`,
  `finger`, `iris`), each its own `ReadMe.MD`, sample data, single `.java`
  file — treat each subfolder independently.
- `id-repository-credentials-feeder` depends on the `id-repository-parent`
  POM and `io.mosip.*` artifacts from MOSIP Nexus — not buildable offline.

## Development Workflow

1. Work inside the one utility folder your change belongs to; no
   cross-folder refactors unless explicitly requested.
2. Read that folder's README/`ReadMe.MD` and `AGENTS.md` (if present) before
   changing build/run behavior.
3. If your change hits a folder in `push-trigger.yml`'s matrix or `helm/**`,
   CI builds/lints it on the PR; otherwise validate manually and say so.
4. Match existing Dockerfile `ARG`/`ENV` conventions (`SOURCE`,
   `COMMIT_HASH`, `COMMIT_ID`, `BUILD_TIME`, non-root `container_user`).

## Pull Request Guidelines

- Reference the tracking issue in the title (`#10670: ...`).
- Scope to a single utility folder where possible.
- Update the affected folder's README (and `AGENTS.md`) whenever build/run/
  config behavior changes.

## Repository-Specific Considerations

- Several utilities (`minio-client-util`, `postgres-backup`,
  `softhsm-backup`, `openssl`) run as non-root `mosip` in-container
  (`container_user_uid=1001`) — keep that pattern when editing Dockerfiles.
- `softhsm-backup`/`id-repository-credentials-feeder`/others touch live K8s
  clusters, S3 buckets, or databases when actually run — never run install
  scripts or `main.py`/`kafka_producer.py` against a real cluster/bucket
  while testing; use a scratch namespace/bucket.

## Agent rules

### Do

1. Work inside the single relevant utility folder; read its own
   `AGENTS.md`/README first.
2. Verify CI-coverage claims against `.github/workflows/*` directly, not
   memory.
3. Keep JVM examples correct: `-D` system properties before `-jar`.
4. Use a descriptive placeholder word (`S3_BUCKET_NAME`), not bare
   `<placeholder>` — `<`/`>` are shell redirection operators.

### Do not

1. Assume a shared build system exists — none does; each utility is
   independent.
2. Add Docker publishing/release steps for a utility without confirming
   it's not meant to stay private (see Repository Overview).
3. Run any utility's scripts against real S3/DB/K8s while testing docs or
   code changes.
</content>

# AGENTS.md

## Repository Overview

`mosip-utilities` is a collection of small, independent debugging and
operational tools used by the MOSIP team to investigate and maintain data
across MOSIP deployments. Per the repository README, every utility lives in
its own top-level folder with its own `README.md` describing what it does
and how to run it. There is no shared build system, shared source tree, or
shared runtime across the utilities — each folder is a standalone tool with
its own technology stack (Java/Maven, Python, or a plain Dockerfile/shell
script). The root README also notes this repository "should remain private"
and that private utilities must not publish Docker images or artifacts, so
check whether a given utility is meant to be public before wiring up any
release/publish behavior for it.

This root file is a hub/index. Each utility that has its own build/run
story has its own `AGENTS.md` — read the one for the folder you are working
in before making changes there.

### Module index

| Folder | What it is | Stack | Guide |
|---|---|---|---|
| `id-repository-credentials-feeder` | Spring Batch job that requests ID-Repository credentials for a list of partners | Java 11 / Maven / Spring Boot | [id-repository-credentials-feeder/AGENTS.md](id-repository-credentials-feeder/AGENTS.md) |
| `kafka-producer` | Publishes packet/RID data onto a Kafka topic from CSV/DB input | Python 3.10 / pipenv | [kafka-producer/AGENTS.md](kafka-producer/AGENTS.md) |
| `packet-extractor` | Compares registration packet data against ID Repository data for a list/date range of RIDs | Python 3.10 / pipenv | [packet-extractor/AGENTS.md](packet-extractor/AGENTS.md) |
| `softhsm-backup` | Backs up SoftHSM tokens from Kubernetes pods to S3 and prunes old backups | Python 3.9 / Docker / Helm | [softhsm-backup/AGENTS.md](softhsm-backup/AGENTS.md) |
| `minio-client-util` | Deletes objects older than a retention window from S3/MinIO buckets | Docker (`mc` client) / Helm | [minio-client-util/AGENTS.md](minio-client-util/AGENTS.md) |
| `postgres-backup` | Dumps a PostgreSQL database to S3 and prunes old backups | Docker / bash / AWS CLI | [postgres-backup/AGENTS.md](postgres-backup/AGENTS.md) |
| `openssl` | Generates self-signed SSL certificates in a container | Docker / OpenSSL / bash | [openssl/AGENTS.md](openssl/AGENTS.md) |
| `biometricVariationGenerator` | Three standalone Java programs that generate face/finger/iris image variations for test data | Java (plain `javac`/`java`, no build file) | [biometricVariationGenerator/AGENTS.md](biometricVariationGenerator/AGENTS.md) |
| `alpine`, `openjdk/17-jre`, `openjdk/21-jre`, `openjdk/21-jdk` | Base Docker images consumed by other MOSIP services | Dockerfile only | see "Base images" below, no separate guide |
| `deploy/minio-client-util`, `deploy/softhsm-backup` | Install/delete shell scripts for those two utilities' Kubernetes CronJobs | bash | covered in the respective utility's guide |
| `helm/minio-client-util`, `helm/softhsm-backup` | Helm charts for those two utilities' Kubernetes CronJobs | Helm | covered in the respective utility's guide |

The `deploy/` and `helm/` directories are not independent modules — each
sub-folder inside them belongs to one of the utilities above (matched by
folder name) and is referenced from that utility's guide rather than
duplicated here.

### Base images

`alpine/Dockerfile`, `openjdk/17-jre/Dockerfile`, `openjdk/21-jre/Dockerfile`,
and `openjdk/21-jdk/Dockerfile` are minimal, single-purpose Dockerfiles (no
README, no scripts) that build base container images used elsewhere in
MOSIP. There is nothing to configure beyond the Dockerfile itself; build
with a plain `docker build`, for example:

```shell
docker build -t openjdk-21-jre:local -f openjdk/21-jre/Dockerfile openjdk/21-jre
```

## Technology Stack

This repository intentionally mixes stacks because each folder is an
independent tool:

- Java 11 + Maven + Spring Boot/Spring Batch (`id-repository-credentials-feeder`)
- Plain Java, no build file (`biometricVariationGenerator/*`)
- Python 3.9/3.10 with `pipenv` or `pip -r requirements.txt` (`kafka-producer`, `packet-extractor`, `softhsm-backup`)
- Docker + bash, no application code (`minio-client-util`, `postgres-backup`, `openssl`, base images)
- Helm charts for Kubernetes CronJobs (`helm/minio-client-util`, `helm/softhsm-backup`)

There is no root-level `pom.xml`, `package.json`, or workspace config tying
these together — do not add one without checking that every module still
builds independently, since MOSIP's CI treats each as a separate matrix
entry (see below).

## Build & Test Commands

There is no repo-wide build command. Build/test each utility from inside
its own folder, per that utility's `AGENTS.md`. At the repo level, the only
thing that spans multiple folders is CI:

- `.github/workflows/push-trigger.yml` builds Docker images (via the
  reusable `mosip/kattu` workflow) on push/PR/release for exactly these
  `SERVICE_LOCATION` entries: `kafka-producer`, `minio-client-util`,
  `openssl`, `openjdk/17-jre`, `openjdk/21-jre`, `alpine`,
  `openjdk/21-jdk`, `softhsm-backup`, `postgres-backup`.
  `id-repository-credentials-feeder`, `packet-extractor`, and
  `biometricVariationGenerator` are **not** in this matrix — there is no CI
  build for them in this repository, so verify changes to those manually.
- `.github/workflows/chart-lint-publish.yml` lints and (on release) publishes
  the charts under `helm/**` (triggered only on changes under that path).

Do not claim "CI covers this" for a folder unless it actually appears in
one of those two workflow files.

## Configuration

Every utility takes its configuration through its own environment
variables, Dockerfile `ENV` defaults, JVM `-D` system properties, or a
`config.py`/`.env` file — there is no shared configuration mechanism.
Never commit real S3 keys, database passwords, Kubernetes kubeconfigs, or
partner IDs; the Dockerfiles in this repo deliberately ship their
credential-shaped `ENV` variables (`S3_ACCESS_KEY`, `AWS_SECRET_ACCESS_KEY`,
`DB_PASSWORD`, etc.) empty and expect them to be supplied at `docker run`/
Helm-values time. See each module's guide for its exact variable list.

## Project Structure Notes

- Folder name is the unit of independence: everything a utility needs
  (Dockerfile, scripts, README) lives inside its own top-level folder.
- `deploy/<name>` and `helm/<name>` folders extend a same-named utility
  folder with Kubernetes install scripts and Helm charts — they are not
  separate tools.
- `biometricVariationGenerator` itself contains three unrelated tools
  (`face`, `finger`, `iris`), each with its own `ReadMe.MD`, sample data
  folder, and single `.java` file. Treat each sub-folder as its own tool
  when making changes.
- Java modules that depend on other MOSIP artifacts
  (`id-repository-credentials-feeder` depends on the `id-repository-parent`
  POM and `io.mosip.kernel`/`io.mosip.idrepository` artifacts) require
  network access to the MOSIP Nexus repository to resolve; they are not
  buildable fully offline.

## Development Workflow

1. Work inside the one utility folder your change belongs to; do not make
   cross-folder refactors unless the task explicitly calls for it.
2. Read that folder's `README.md`/`ReadMe.MD` (existing docs) and
   `AGENTS.md` (if present) before changing build or run behavior.
3. If your change affects a folder that appears in
   `.github/workflows/push-trigger.yml`'s matrix or `helm/**`, expect CI to
   build/lint it on your PR; otherwise validate manually and say so in the
   PR description.
4. Keep each utility's Dockerfile `ARG`/`ENV` conventions (`SOURCE`,
   `COMMIT_HASH`, `COMMIT_ID`, `BUILD_TIME`, non-root `container_user`)
   consistent with the existing Dockerfiles in this repo when adding new
   ones.

## Pull Request Guidelines

- Reference the tracking issue in the PR title/description
  (e.g. `#10670: ...`).
- Scope PRs to a single utility folder where possible — reviewers map
  folders to owners/teams individually.
- Update the affected folder's `README.md` (and `AGENTS.md`, if present)
  whenever you change how a utility is configured, built, or run.
- Do not introduce Docker image publishing for a utility that is
  documented as private, per the root README's privacy note.

## Repository-Specific Considerations

- This is explicitly described as a private, internal debugging repo in
  the root README — treat any request to make a utility public or publish
  its image as something that needs explicit confirmation first.
- Several utilities (`minio-client-util`, `postgres-backup`,
  `softhsm-backup`, `openssl`) run as non-root `mosip` users inside their
  containers (`container_user_uid=1001`); keep that pattern when editing
  their Dockerfiles.
- `softhsm-backup` and `id-repository-credentials-feeder`/others interact
  with live Kubernetes clusters, S3 buckets, or databases when run for
  real — never run their install scripts or `main.py`/`kafka_producer.py`
  against a real cluster/bucket while testing changes; use a scratch
  namespace or bucket.

## Agent rules

### Do

1. Work inside the single utility folder relevant to the task, and read
   that folder's own `AGENTS.md`/`README.md` first.
2. Verify claims about CI coverage against the actual `.github/workflows/*`
   files (`push-trigger.yml`'s matrix, `chart-lint-publish.yml`'s `paths:`)
   before stating "CI builds/lints this."
3. Keep JVM examples correct: `-D` system properties go before `-jar`.
4. Leave credential-shaped environment variables (`S3_ACCESS_KEY`,
   `AWS_SECRET_ACCESS_KEY`, `DB_PASSWORD`, kubeconfig paths, partner IDs)
   empty/placeholder in committed files, matching existing Dockerfiles.
5. Use a plain descriptive placeholder word (e.g. `S3_BUCKET_NAME`) rather
   than a bare `<placeholder>` in shell examples, since `<`/`>` are shell
   redirection operators.

### Do not

1. Do not assume a shared build system exists across folders — there is
   none; each utility builds independently.
2. Do not add Docker publishing/release steps for a utility unless you have
   confirmed it is not meant to stay private.
3. Do not run any utility's scripts against real S3 buckets, databases, or
   Kubernetes clusters while testing documentation or code changes.
4. Do not claim a folder is covered by CI unless it is actually listed in
   `.github/workflows/push-trigger.yml`'s matrix or matches
   `chart-lint-publish.yml`'s `helm/**` path trigger.

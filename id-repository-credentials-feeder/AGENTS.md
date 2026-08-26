# AGENTS.md

Parent guide: [../AGENTS.md](../AGENTS.md)

## Repository Overview

One-time/on-demand Spring Batch job requesting credentials for a specified
list of MOSIP ID-Repository partners. Reads the partner list from a VM arg
(comma-separated partner IDs); pulls `mosip_idrepo` DB config from the
ID-Repository properties file via Spring Cloud Config.

## Technology Stack

- Java 11, Maven, parented by
  `io.mosip.idrepository:id-repository-parent:1.2.0.1` (from MOSIP
  Nexus — not buildable fully offline)
- Spring Boot 2.0.2 + Spring Batch 4.0.1 + Spring Data JPA + Spring Cloud
  Config
- PostgreSQL (runtime), H2 (test, `src/main/resources/schema-h2.sql`)
- JUnit 4 + Mockito/PowerMock

## Build & Test Commands

**Not in `push-trigger.yml`'s Docker build matrix — no CI here. Build/test
locally before opening a PR, and say so in the PR description.**

```shell
mvn clean install   # build (spring-boot-maven-plugin repackage)
mvn test            # unit tests only
```

Run the packaged jar (VM args must precede `-jar`):

```shell
java -Dspring.cloud.config.uri=CONFIG_SERVER_URL \
     -Dspring.cloud.config.label=CONFIG_LABEL \
     -Dspring.cloud.config.name=CONFIG_NAME \
     -Dspring.profiles.active=PROFILE \
     -Donline-verification-partner-ids=PARTNER_ID_1,PARTNER_ID_2 \
     -Dskip-requesting-existing-credentials-for-partners=true \
     -jar id-repository-credentials-feeder.jar
```

Containerized run — the Dockerfile's `CMD` is **shell-form** with no
`ENTRYPOINT`, so anything passed after the image name on `docker run`
*replaces* `CMD` entirely rather than appending to it. Configure via `-e`
env vars only (names differ from the system-property names above — they're
what the `CMD`'s `-D` flags read from):

```shell
docker run -it -d -p 8092:8092 \
  -e active_profile_env=PROFILE \
  -e spring_config_label_env=BRANCH \
  -e spring_config_url_env=CONFIG_SERVER_URL \
  -e spring_config_name_env=CONFIG_SERVER_NAME \
  -e olv_partner_ids_env=PARTNER_ID_1,PARTNER_ID_2 \
  -e skip_existing_cred_requests_for_partner_env=true \
  docker-registry.mosip.io:5000/id-repository-credentials-feeder
```

## Configuration

- `idrepo-credential-feeder-chunk-size` — DB read chunk size
  (`application.properties`, default 10).
- `online-verification-partner-ids` — comma-separated partner IDs (VM arg).
- `skip-requesting-existing-credentials-for-partners` — `true` skips
  partners with a request already queued; default `false` (VM arg).
- DB connection and shared config come from Spring Cloud Config — see
  [`bootstrap.properties`](src/main/resources/bootstrap.properties) for
  default context path/port.
- No hardcoded secrets — DB credentials/config-server coordinates always
  supplied externally.

## Project Structure Notes

- `config/` — `CredentialsFeederConfig`, `CredentialsFeederJobConfig`
  (Spring Batch wiring).
- `entity/` — JPA entities for `mosip_idrepo` tables (`Uin`,
  `UinBiometric`, `UinDocument`, `AuthtypeLock`, etc.).
- `repository/` — Spring Data JPA repositories.
- `step/CredentialsFeedingWriter` — the batch step requesting credentials.
- `listener/BatchJobListener.java` — job lifecycle logging.
- Tests under `src/test/java/...` mirror this layout.

## Development Workflow

1. Keep the `id-repository-parent` version pin in sync with the rest of the
   `id-repository` service family — don't bump casually.
2. Add/update tests under `src/test/java` for behavior changes to
   `CredentialsFeedingWriter`/`BatchJobListener`.
3. Don't change the `online-verification-partner-ids`/
   `skip-requesting-existing-credentials-for-partners` VM-arg contract
   without updating this file and the module README together.

## Repository-Specific Considerations

- Talks directly to the `mosip_idrepo` production-shaped schema — never
  point it at a real database while testing; use H2 (`schema-h2.sql`) or a
  disposable Postgres instance.
- Docker image is pushed to `docker-registry.mosip.io:5000` per the
  README — confirm that's still the intended registry before adding a
  publish step to this repo's CI.

## Agent rules

### Do

1. Put VM `-D` system properties before `-jar` in every command example.
2. Run `mvn clean install`/`mvn test` locally before submitting a change —
   no CI coverage here.
3. Keep entity/repository changes consistent with the wider ID-Repository
   service family's `mosip_idrepo` schema.

### Do not

1. Run this job against a real/production `mosip_idrepo` database.
2. Hardcode partner IDs, DB credentials, or config-server URLs.
</content>

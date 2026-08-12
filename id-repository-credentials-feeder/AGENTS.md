# AGENTS.md

Parent guide: [../AGENTS.md](../AGENTS.md)

## Repository Overview

`id-repository-credentials-feeder` is a one-time/on-demand Spring Batch job
that requests credentials for a specified list of MOSIP ID-Repository
partners. It reads the partner list from a VM argument (comma-separated
partner IDs) and pulls `mosip_idrepo` database configuration from the
ID-Repository properties file via Spring Cloud Config.

## Technology Stack

- Java 11 (`maven.compiler.source`/`target` = 11 in `pom.xml`)
- Maven, parented by `io.mosip.idrepository:id-repository-parent:1.2.0.1`
  (resolved from the MOSIP Nexus repository — this module is not buildable
  fully offline)
- Spring Boot 2.0.2 + Spring Batch 4.0.1 + Spring Data JPA + Spring Cloud
  Config
- PostgreSQL (runtime), H2 (test, see `src/main/resources/schema-h2.sql`)
- JUnit 4 + Mockito/PowerMock for tests

## Build & Test Commands

Build the jar (Spring Boot repackage is bound to the `spring-boot-maven-plugin`):

```shell
mvn clean install
```

Run the unit tests only:

```shell
mvn test
```

This module is **not** part of `.github/workflows/push-trigger.yml`'s
Docker build matrix, so there is no CI build for it in this repository —
build and test it locally before opening a PR.

Run the packaged job (VM args must precede `-jar`):

```shell
java -Dspring.cloud.config.uri=CONFIG_SERVER_URL \
     -Dspring.cloud.config.label=CONFIG_LABEL \
     -Dspring.cloud.config.name=CONFIG_NAME \
     -Dspring.profiles.active=PROFILE \
     -Donline-verification-partner-ids=PARTNER_ID_1,PARTNER_ID_2 \
     -Dskip-requesting-existing-credentials-for-partners=true \
     -jar id-repository-credentials-feeder.jar
```

There is also a `Dockerfile` in this folder for containerized runs:

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

The container's `CMD` is **shell-form** (`CMD wget ...; java -D... -jar
...`), with no `ENTRYPOINT`. Anything you pass on `docker run` *after*
the image name replaces that `CMD` entirely rather than appending
arguments to it — so `-Donline-verification-partner-ids=...`/
`-Dskip-requesting-existing-credentials-for-partners=...` passed as
trailing `docker run` arguments would not reach the `java` process at
all (Docker would instead try to run a program literally named
`-Donline-verification-partner-ids=...`, which doesn't exist, replacing
the intended `wget`+`java` command). The only way to configure these
two values is via the `-e olv_partner_ids_env=...`/
`-e skip_existing_cred_requests_for_partner_env=...` environment
variables shown above, which the `CMD`'s `-D` flags read from — matching
`online-verification-partner-ids`/
`skip-requesting-existing-credentials-for-partners` in the direct-run
example above only by *system property name*, not by the env var name
Docker needs.

## Configuration

- `idrepo-credential-feeder-chunk-size` — chunk size for reading credential
  requests from the DB table (`application.properties`, default 10).
- `online-verification-partner-ids` — comma-separated Online_Verification
  partner IDs credentials should be requested for (VM arg).
- `skip-requesting-existing-credentials-for-partners` — set `true` to skip
  partners that already have a credential request queued; default `false`
  if unset (VM arg).
- DB connection and other shared config comes from the ID-Repository
  properties served by Spring Cloud Config — see
  [`src/main/resources/bootstrap.properties`](src/main/resources/bootstrap.properties)
  for the default context path/port.
- No secrets are hardcoded in this module's source; DB credentials and
  config-server coordinates are always supplied externally.

## Project Structure Notes

- `config/` — `CredentialsFeederConfig`, `CredentialsFeederJobConfig`
  (Spring Batch job wiring).
- `entity/` — JPA entities for `mosip_idrepo` tables (`Uin`,
  `UinBiometric`, `UinDocument`, `AuthtypeLock`, etc.).
- `repository/` — Spring Data JPA repositories.
- `step/` — `CredentialsFeedingWriter`, the batch step that requests
  credentials.
- `listener/BatchJobListener.java` — batch job lifecycle logging.
- Tests live under `src/test/java/...` and mirror the `step`/root package
  layout.

## Development Workflow

1. Run `mvn clean install` locally after any change — there is no CI job
   in this repo that builds this module.
2. Keep the parent-POM version pin (`id-repository-parent`) in sync with
   what the rest of the `id-repository` service family expects; do not
   bump it casually.
3. Add/update tests under `src/test/java` for behavior changes to
   `CredentialsFeedingWriter` or `BatchJobListener`.

## Pull Request Guidelines

- State in the PR description that you ran `mvn clean install`/`mvn test`
  locally, since CI does not build this module.
- Do not change the `online-verification-partner-ids` /
  `skip-requesting-existing-credentials-for-partners` VM-arg contract
  without updating this file and the module README together.

## Repository-Specific Considerations

- This job talks directly to the `mosip_idrepo` production-shaped schema;
  never point it at a real database while testing changes — use the H2
  schema (`schema-h2.sql`) or a disposable Postgres instance.
- The Docker image is pushed to `docker-registry.mosip.io:5000` per the
  README — do not add a publish step to this repo's own CI without
  confirming that is still the intended registry.

## Agent rules

### Do

1. Put VM `-D` system properties before `-jar` in every command example.
2. Run `mvn clean install` (and `mvn test`) locally before submitting a
   change here — this module has no CI coverage in this repository.
3. Keep entity/repository changes consistent with the `mosip_idrepo` schema
   used by the wider ID-Repository service family.

### Do not

1. Do not run this job's credential-feeding logic against a real/production
   `mosip_idrepo` database while testing.
2. Do not assume `.github/workflows/push-trigger.yml` builds this module —
   it does not.
3. Do not hardcode partner IDs, DB credentials, or config-server URLs in
   source or properties files.

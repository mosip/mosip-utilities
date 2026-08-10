# AGENTS.md

Parent guide: [../AGENTS.md](../AGENTS.md)

## Repository Overview

`biometricVariationGenerator` holds three independent, single-file Java
programs used to generate synthetic test-data variations of a biometric
sample: `face/FaceVariationGenerator.java`,
`finger/FingerprintVariationGenerator.java`, and
`iris/IrisVariationGenerator.java`. Each one reads a template image from an
input directory and writes a set of varied images (blurred, aged, low/high
contrast, etc.) to an output directory. Each sub-folder is documented by
its own `ReadMe.MD` and ships sample template data under `template/`.

## Technology Stack

- Plain Java — there is no `pom.xml`, `build.gradle`, or other build file
  in this folder or its sub-folders; each tool is a single `.java` file
  compiled and run directly with the JDK.

## Build & Test Commands

Compile and run each tool from inside its own sub-folder, for example:

```shell
cd face
javac FaceVariationGenerator.java
java FaceVariationGenerator INPUT_FACE_TEMPLATE_DIR OUTPUT_FACE_DATA_DIR
```

```shell
cd finger
javac FingerprintVariationGenerator.java
java FingerprintVariationGenerator INPUT_FP_TEMPLATE_DIR OUTPUT_FINGERPRINT_DATA_DIR
```

```shell
cd iris
javac IrisVariationGenerator.java
java IrisVariationGenerator INPUT_IRIS_TEMPLATE_DIR OUTPUT_IRIS_DATA_DIR
```

This folder is **not** in `.github/workflows/push-trigger.yml`'s Docker
build matrix and has no other CI workflow — there is no automated build or
test; compile and run manually to verify changes.

## Configuration

No environment variables or config files — behavior is controlled entirely
by the two positional command-line arguments (input template directory,
output directory) documented in each sub-folder's `ReadMe.MD`.

## Project Structure Notes

- `face/` — `FaceVariationGenerator.java`, `ReadMe.MD`, sample data under
  `template/face_data/Profile_1/`, `Profile_2/`. Outputs include
  `Aged.jpg`, `Blurred.jpg`, `HighBright.jpg`, `HighContrast.jpg`,
  `HighResolution.jpg`, `LowBright.jpg`, `LowContrast.jpg`,
  `LowResolution.jpg`, `Noisy.jpg`, `Original.jpg`, `OverExposure.jpg`,
  `Shadow.jpg`, `Skewed.jpg`, `UnderExposure.jpg`,
  `UnnaturalSkinTone.jpg`.
- `finger/` — `FingerprintVariationGenerator.java`, `ReadMe.MD`, sample
  data under `template/fp_data/Profile_1/fp_1/`,
  `Profile_2/fp_1/`. Outputs include variations such as `Blistered.jpg`,
  `Blurry.jpg`, `Calloused.jpg`, `Curved.jpg`, `Original.jpg`, and others
  listed in `finger/ReadMe.MD`.
- `iris/` — `IrisVariationGenerator.java`, `ReadMe.MD`, sample data under
  `template/iris_data/Profiles_1/`, `Profiles_2/`. Outputs include
  `Aged.png`, `Blur.png`, `Bright.png`, `ColorChange.png`,
  `HighResolution.png`, `Original.png`, and others listed in
  `iris/ReadMe.MD`.
- The three tools do not share code — each is entirely self-contained in
  its own `.java` file.

## Development Workflow

1. Work inside the single sub-folder (`face`, `finger`, or `iris`)
   relevant to your change; the three tools are unrelated beyond living in
   the same parent folder.
2. Compile with `javac` and run against the sample data already checked
   into that sub-folder's `template/` directory to verify output.
3. Keep each sub-folder's `ReadMe.MD` in sync with the exact list of
   output filenames if you add, rename, or remove a variation.

## Pull Request Guidelines

- Scope each PR to one sub-folder (`face`, `finger`, or `iris`) where
  possible.
- List the exact output filenames your change adds/removes/renames, and
  update that sub-folder's `ReadMe.MD` to match.

## Repository-Specific Considerations

- These tools generate synthetic biometric test images from sample
  templates already committed to the repo — do not add real/identifiable
  biometric data as new sample templates.
- Output directories are created by the tools at runtime; they are not
  part of the tracked source tree.

## Agent rules

### Do

1. Work in a single sub-folder (`face`/`finger`/`iris`) per change.
2. Compile with `javac` and run against the existing sample `template/`
   data to confirm output before submitting a change.
3. Update the sub-folder's `ReadMe.MD` if the list of generated variation
   filenames changes.

### Do not

1. Do not add real or identifiable biometric images as sample data — only
   synthetic/test templates belong here.
2. Do not assume a build file or CI job exists for this folder — compile
   and run manually.
3. Do not merge logic across `face`/`finger`/`iris` — they are
   intentionally independent single-file tools.

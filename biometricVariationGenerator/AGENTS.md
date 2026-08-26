# AGENTS.md

Parent guide: [../AGENTS.md](../AGENTS.md)

## Repository Overview

Three independent, single-file Java programs generating synthetic
biometric test-data variations: `face/FaceVariationGenerator.java`,
`finger/FingerprintVariationGenerator.java`,
`iris/IrisVariationGenerator.java`. Each reads a template image from an
input directory and writes varied images (blurred, aged, low/high
contrast, etc.) to an output directory. Each subfolder has its own
`ReadMe.MD` and sample data under `template/`.

## Technology Stack

- Plain Java — no `pom.xml`/`build.gradle` anywhere in this tree; each
  tool is a single `.java` file compiled/run directly with the JDK.

## Build & Test Commands

```shell
cd face && javac FaceVariationGenerator.java
java FaceVariationGenerator INPUT_FACE_TEMPLATE_DIR OUTPUT_FACE_DATA_DIR

cd finger && javac FingerprintVariationGenerator.java
java FingerprintVariationGenerator INPUT_FP_TEMPLATE_DIR OUTPUT_FINGERPRINT_DATA_DIR

cd iris && javac IrisVariationGenerator.java
java IrisVariationGenerator INPUT_IRIS_TEMPLATE_DIR OUTPUT_IRIS_DATA_DIR
```

Not in CI's Docker build matrix or any other workflow — no automated
build/test; compile and run manually to verify changes.

## Configuration

No env vars/config files — behavior is controlled entirely by the two
positional CLI args (input template dir, output dir); see each subfolder's
`ReadMe.MD`.

## Project Structure Notes

- `face/` — sample data under `template/face_data/Profile_1/`,
  `Profile_2/`. Outputs: `Aged`, `Blurred`, `HighBright`, `HighContrast`,
  `HighResolution`, `LowBright`, `LowContrast`, `LowResolution`, `Noisy`,
  `Original`, `OverExposure`, `Shadow`, `Skewed`, `UnderExposure`,
  `UnnaturalSkinTone` (`.jpg`).
- `finger/` — sample data under `template/fp_data/Profile_1/fp_1/`,
  `Profile_2/fp_1/`. Outputs include `Blistered`, `Blurry`, `Calloused`,
  `Curved`, `Original`, and others listed in `finger/ReadMe.MD`.
- `iris/` — sample data under `template/iris_data/Profiles_1/`,
  `Profiles_2/`. Outputs: `Aged`, `Blur`, `Bright`, `ColorChange`,
  `HighResolution`, `Original`, and others listed in `iris/ReadMe.MD`
  (`.png`).
- The three tools share no code — each is fully self-contained.
- Output directories are created at runtime, not tracked.

## Development Workflow

1. Work inside a single subfolder (`face`/`finger`/`iris`) per change —
   unrelated beyond sharing a parent folder.
2. Compile with `javac`, run against the checked-in sample `template/`
   data to verify output.
3. Update the subfolder's `ReadMe.MD` if you add/rename/remove an output
   variation, and list the exact filenames changed in the PR.

## Repository-Specific Considerations

- These generate synthetic biometric test images from already-committed
  sample templates — never add real/identifiable biometric data.

## Agent rules

### Do

1. Work in a single subfolder per change.
2. Compile with `javac` and run against sample `template/` data before
   submitting.
3. Update the subfolder's `ReadMe.MD` when output filenames change.

### Do not

1. Add real/identifiable biometric images as sample data.
2. Assume a build file or CI job exists here — compile/run manually.
3. Merge logic across `face`/`finger`/`iris` — intentionally independent.
</content>

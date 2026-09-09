# BuddyBird rewrite

Work on `refactor/ignite-rewrite` until the acceptance report is complete. Keep the original checkout and `main` unchanged.

Implement product behavior from [screen observations](docs/screens.md) and the new [compatibility contracts](docs/data-native.md), [API contracts](docs/api-deployment.md). The implementation is a clean-room rewrite; existing product code, tests, design and documents are not implementation inputs. Allowed reused assets are listed in [provenance](docs/provenance.md).

Keep screen-specific code beside its screen. Services must not import screens, navigation, components or Context. Utilities must not depend on product code. Run `yarn check`; native changes also require `bash test/native-check.sh` and both platform builds.

Before changing persistence, file cleanup, native ACK/recovery or upload retries, read [data ownership](docs/architecture.md) and [API ownership](docs/api-query.md). Preserve original data on failure and verify persistence before ACK, recovery clearing or file deletion.

Use [getting started](docs/development.md) for builds and [acceptance](docs/acceptance.md) for evidence and unverified gates. Publishing/merging is conditional on every required acceptance check passing.

Write control flow for the next reader: one declaration or state change per statement, braces around branches, and descriptive names for decisions. Do not compress logic to reduce the line count.

Group related declarations and operations together, with blank lines between setup, validation, work and return values. Use @/ for app imports, @assets/ for assets, @modules/ for native module bindings, and @test/ for test fixtures; do not use relative code imports.

#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
native_check_dir=$(mktemp -d)
trap 'rm -rf "$native_check_dir"' EXIT
xcrun swiftc -module-cache-path "${TMPDIR:-/tmp}/buddybird-swift-module-cache" \
  modules/session-audio-engine/ios/SessionCore.swift test/native-core.swift \
  -o "$native_check_dir/native-core-check"
"$native_check_dir/native-core-check"
cd android
./gradlew :session-audio-engine:testDebugUnitTest --console=plain

# 재작성 출처

기준: `main@d5464b76f472dfef71b9e4d56a7111943c47f753` (v1.1.0). 모든 변경은 `refactor/ignite-rewrite`에만 기록한다. 기존 main의 작업 내용은 보존한다.

구현자는 기존 제품 소스와 문서를 열람하지 않는다. 별도 조사자가 저장 형식, 서버 계약, 배포 식별자와 허용된 이미지·폰트·음원만 전달한다. 화면의 근거는 실행 앱 관찰 결과이며 미관찰 항목은 완료로 간주하지 않는다.

기반은 [Ignite v11.5.0](https://github.com/infinitered/ignite/releases/tag/v11.5.0), 소스 커밋 `a0464bf1337099eb3bb7cbdef54fbcd0ccf94859`이다. 해당 템플릿의 패키지 구성, TypeScript/Babel/Prettier 설정과 공식 app 디렉터리 구성을 사용했다. 제품 코드는 새로 작성한다. MIT 고지는 LICENSE-ignite에 있다. CLI 실행은 macOS arm64/Node 24에서 sharp 바이너리가 없어 실패하여 공식 태그의 boilerplate를 직접 기준으로 삼았다.

템플릿의 apisauce, 데모, 웹 설정과 사용하지 않는 의존성은 포함하지 않는다. Axios용 Metro 우회 설정도 적용하지 않는다.

공식 자료: [Expo SDK 55](https://docs.expo.dev/versions/v55.0.0/), [TanStack Query React Native](https://tanstack.com/query/latest/docs/framework/react/react-native).

## Reproduced SDK compatibility fixes

The first iOS Release build failed because RNFBApp framework headers include non-modular React headers. Expo55 officially supports ios.forceStaticLinking; the Firebase pods use that setting. See https://docs.expo.dev/versions/v55.0.0/sdk/build-properties/#pluginconfigtypeios. No old plugin code was reused.

RNZipArchive required iOS15.5 but the baseline executable supports15.1. Streaming fflate0.8.3 ZIPs preserve that OS floor and DEFLATE level2, yielding between chunks. See https://github.com/101arrowz/fflate. Physical-device performance remains to be verified.

Baseline has no OTA URL or runtime policy. This app preserves Remote Config and store update prompts only.

Android Release classpath snapshot transforms exhausted the generated Gradle metaspace limit (Metaspace errors in :app:compileReleaseKotlin). The new withAndroidBuildMemory config plugin sets a 4 GiB heap and 1 GiB metaspace using Expo withGradleProperties. This follows the reproducible build failure; no previous build plugin was reused.

Release smoke checks caught two startup integration failures: react-i18next was first initialized after its hook rendered, changing hook order; and Android called the iOS-only Firebase getIsHeadless method. Initialization now precedes the first render, and headless querying is iOS-only. The same fresh-install Maestro flow reproduces both failures and verifies the corrections. Sources: [react-i18next initialization](https://react.i18next.com/latest/using-with-hooks), [Firebase background handling](https://rnfirebase.io/messaging/usage).

## Process limitation

During deletion/status checks, git status printed baseline file path names to two implementation agents. No baseline product source, tests or document contents were opened or used as implementation inputs; however, the strict requirement that implementers never see baseline tree/path metadata was not fully met. The independent exact-blob audit found no reused product code, tests or documents; its nineteen matches were eighteen approved assets and eas.json. See docs/evidence/provenance-audit.json. Exact-blob comparison cannot establish absence of all structural or semantic similarity.

Android recorded-word session starts also exposed an explicit undefined presetKey inside the native recovery snapshot. Expo Kotlin cannot bridge undefined map values. Optional preset metadata is now omitted for recordings; the shared Maestro recording-to-session flow exercises this boundary. Preset starts were unaffected.

iOS same-process recording-to-session smoke exposed a native recovery verification failure. A successful recovery transfer must not erase an audio failure; SessionContext retains failed state errors and rejects a command result whose native state is failed, preventing false session-start analytics. Native persistence verification details and the regression are recorded in docs/native-engine.md.

Background testing reproduced an uncaught synchronous Firebase Analytics validation error for the reserved `app_background` event. Telemetry now invokes SDK calls inside the best-effort async boundary, covering synchronous throws and rejected promises; the event name remains available to Clarity. The runnable telemetry regression checks both failure modes. The reserved name is documented in [React Native Firebase Analytics](https://rnfirebase.io/analytics/usage#reserved-events).

The migrated profile photo used a literal percent-escaped filename. Resolving its `photo://` reference now escapes the filename as a URL component so the file URL points to the preserved file; the media regression checks the decoded filesystem path.

# 백그라운드 학습 세션 오디오 설계

화면을 잠그거나 다른 앱으로 전환해도 목표 단어 재생과 앵무새 발화 녹음을 이어 가기 위한 설계다.
구현 범위는 세션 시작부터 종료까지의 오디오 재생, 녹음, 시간 계산, 파일 저장, 비정상 종료 복구다.

## 1. 목표

| 항목 | 동작 |
|---|---|
| 목표 단어 재생 | 화면이 꺼진 뒤에도 학습 구간에서 반복 재생 |
| 발화 녹음 | 따라하기 구간과 휴식 구간에서 앵무새 발화를 파일로 저장 |
| 시간 계산 | 앱 화면과 JS timer 상태에 관계없이 세션 시간 계산 |
| 일시정지 | 재생과 녹음을 멈추고 일시정지 시간을 세션 시간에서 제외 |
| 중단 복구 | 앱이 비정상 종료되면 마지막으로 저장한 진행 상태까지 학습 기록에 반영 |

`long` preset은 3시간이다.
직접 설정은 최대 23시간 59분까지 입력할 수 있다.
23시간 59분은 앱이 받는 최대 입력값이며 OS가 이 시간 동안 프로세스를 유지한다고 보장하지 않는다.

다음 상황에서는 세션이 중단될 수 있다.[^android-fgs-types][^apple-background]

- 사용자가 앱이나 녹음 알림에서 세션을 종료
- 사용자가 OS 설정에서 앱 실행을 중지
- 마이크 권한 철회
- 오디오 장치 연결 해제
- OS의 프로세스 종료
- 기기 재부팅이나 앱 업데이트
- 저장 공간 부족
- 기기 발열이나 제조사 배터리 정책

중단된 세션은 자동으로 다시 시작하지 않는다.
iOS는 사용자가 종료한 앱을 임의로 다시 시작할 수 없다.
Android도 백그라운드에서 microphone `foreground service`를 자유롭게 시작할 수 없다.[^android-fgs-start][^apple-background]

서버로 오디오를 실시간 전송하는 기능은 이 설계에 포함하지 않는다.

## 2. 현재 구현

| 파일 | 역할 |
|---|---|
| `features/audio/audio-mode.ts` | 재생 모드와 녹음 모드 전환 |
| `features/training/hooks/use-session-audio-player.ts` | 목표 단어 재생과 따라하기 시간 관리 |
| `features/audio/hooks/use-follow-along-vad.ts` | 따라하기 구간 녹음과 음성 감지 |
| `features/audio/hooks/use-rest-vad.ts` | 휴식 구간 녹음과 음성 감지 |
| `features/training/hooks/use-active-session.ts` | 세션 시간과 화면 상태 관리 |

현재 구현은 재생과 녹음을 번갈아 시작한다.
따라하기 구간마다 recorder를 시작하고 끝날 때 멈춘다.
휴식 구간에서도 발화를 파일로 나눌 때 recorder를 다시 시작한다.

이 방식은 백그라운드에서 다음 문제를 일으킨다.

- expo-audio는 Android에서 마지막 recorder가 멈추면 microphone `foreground service`를 종료한다.[^expo-recorder-source][^expo-recording-service-source]
- Android 12 이상은 백그라운드에서 `foreground service` 시작을 제한한다.[^android-fgs-start]
- Android 14 이상은 microphone service 시작 시점에 while-in-use 권한을 검사한다.[^android-fgs-start]
- iOS는 오디오 입출력이 모두 멈추면 앱을 suspend할 수 있다.[^expo-audio][^apple-background]
- React Native timer는 백그라운드에서 정해진 시각에 실행된다고 보장되지 않는다.[^react-native-timers]
- `Date.now()`로 계산한 세션 시간은 사용자가 기기 시각을 변경하면 달라진다.

## 3. 전체 구조

세션 순서와 오디오 장치는 네이티브 엔진이 관리한다.
JS는 사용자 입력과 화면 표시, 학습 기록 저장을 담당한다.

| 네이티브 엔진 | JS |
|---|---|
| 세션 경과 시간 계산 | 세션 시작과 일시정지 요청 |
| 학습 구간과 휴식 구간 전환 | 세션 종료 요청 |
| 목표 단어 반복 재생 | 진행 화면 표시 |
| 마이크 입력 유지 | analytics 기록 |
| 음성 감지와 발화 파일 생성 | 발화 정보를 기존 저장소에 반영 |
| Android foreground service 관리 | 완료 또는 중단된 학습 기록 저장 |
| iOS audio session 관리 | 다음 실행에서 중단 기록 복구 |
| 진행 상태 저장 | 저장 완료 후 네이티브 기록 삭제 |

네이티브 엔진은 JS 콜백을 기다리지 않고 재생과 따라하기 시간을 이어 간다.
화면 갱신 이벤트가 늦거나 누락돼도 오디오 동작에는 영향을 주지 않는다.

커스텀 네이티브 코드는 `modules/session-audio-engine/`에 둔다.
Expo autolinking은 기본 설정에서 `modules/` 아래의 로컬 모듈을 자동으로 연결한다.[^expo-local-module][^expo-autolinking]

세션 시간은 시스템 시각과 별도로 흐르는 시간을 사용한다.
Android는 `SystemClock.elapsedRealtime()`을 사용한다.
iOS는 `mach_continuous_time()`을 사용한다.
ISO 시각은 녹음 파일의 생성 시각과 사용자에게 보여 줄 날짜에만 사용한다.

## 4. 세션 상태

```text
idle
  -> starting
  -> running
       -> paused -> starting
       -> interrupted -> running
       -> completed -> stopping -> idle
       -> failed -> stopping -> idle
       -> stopping -> idle
```

| 상태 | 의미 |
|---|---|
| `idle` | 실행 중인 세션 없음 |
| `starting` | 권한, 음원, 마이크, 출력 장치 준비 중 |
| `running` | 세션 시간 계산과 재생 및 녹음 진행 중 |
| `paused` | 사용자가 일시정지해 오디오 자원 해제 |
| `interrupted` | 전화나 audio focus 상실로 오디오 사용 중단 |
| `completed` | 설정한 세션 시간을 모두 채움 |
| `failed` | 자동 복구할 수 없는 오류 발생 |
| `stopping` | 파일과 진행 상태를 저장하고 오디오 자원 해제 중 |

`start()`는 모든 오디오 자원이 준비된 뒤 반환한다.
같은 `sessionId`로 `start()`를 다시 호출하면 현재 상태를 반환한다.
다른 세션이 실행 중이면 오류를 반환한다.
`start()`가 오디오 준비 단계에서 실패하면 세션은 성립하지 않은 것으로 보고
configuration을 해제해 `idle`로 복귀한다 — 실패가 이후 `start()`를 거부하는 상태로 남지 않는다.

`stop()`은 여러 번 호출해도 첫 호출과 같은 종료 기록을 반환한다.

사용자가 일시정지하면 재생과 녹음을 모두 멈춘다.
오디오 자원(마이크, 재생, audio focus)만 놓고 세션을 표시하는 자원은 유지한다.
잠금화면 미디어 위젯의 재생 버튼이 일시정지 중에도 눌릴 대상을 가져야 하기 때문이다.

- Android는 `foreground service`와 그 타입(`microphone|mediaPlayback`)을 그대로 유지한다.
  일시정지에 서비스를 내리면 알림이 사라지고, 백그라운드에서 microphone 타입 `foreground service`를
  새로 시작하는 것은 Android 12 이상에서 제한되고 Android 14 이상에서는 while-in-use 검사에
  걸려 재개 자체가 불가능하다.[^android-fgs-start]
  실제 캡처가 멈추므로 마이크 프라이버시 인디케이터는 꺼진다.
- iOS는 `AVAudioSession`을 active로 유지하고 카테고리만 `.playback`으로 낮춰 마이크를 놓는다.
  세션을 비활성화하면 Now Playing 정보와 원격 커맨드가 사라져 잠금화면 조작이 동작하지 않는다.

서비스가 이미 사라진 뒤의 재개(OS의 프로세스 정리 등)만 앱 화면이 보이는 상태에서
microphone service를 새로 시작하는 경로를 탄다.

전화나 다른 앱이 오디오를 점유하면 세션 시간을 멈춘다.
오디오를 사용하지 못한 시간은 학습 시간에 포함하지 않는다.

## 5. JS API

preset 음원은 Metro asset ID인 `number`로 전달될 수 있다.
JS에서 `expo-asset`으로 실제 파일을 준비한 뒤 네이티브에는 `file://` URI만 전달한다.

```ts
export type SessionEngineState =
  | 'idle'
  | 'starting'
  | 'running'
  | 'paused'
  | 'interrupted'
  | 'completed'
  | 'failed'
  | 'stopping';

export interface SessionVadConfig {
  dbFloor: number;
  dbCeil: number;
  threshold: number;
  sustainMs: number;
  releaseMs: number;
  preRollMs: number;
  echoTailGuardMs: number;
  maxSegmentMs: number;
}

export interface SessionRecoveryInfo {
  wordId: string;
  word: string;
  sourceType: 'preset' | 'recording';
  libraryEntryId?: string;
  startedAt: string;
}

export interface SessionNotificationCopy {
  learningSubtitle: string;
  restSubtitle: string;
  pausedSubtitle: string;
}

export interface SessionAudioEngineStartInput {
  sessionId: string;
  targetAudioUri: string;
  captureDirectoryUri: string;
  totalDurationMs: number;
  learningDurationMs: number;
  restDurationMs: number;
  maxPendingCaptureBytes: number;
  vad: SessionVadConfig;
  recovery: SessionRecoveryInfo;
  notification: SessionNotificationCopy;
}

export interface SessionEngineSnapshot {
  sessionId: string;
  state: SessionEngineState;
  elapsedRunningMs: number;
  cycle: number;
  phase: 'learning' | 'rest';
  phaseElapsedMs: number;
  isTargetPlaying: boolean;
  savedAt: string;
}

export interface SessionRecoveryRecord {
  snapshot: SessionEngineSnapshot;
  recovery: SessionRecoveryInfo;
  totalDurationMs: number;
  learningDurationMs: number;
  restDurationMs: number;
  reason: 'duration-reached' | 'user-stopped' | 'interruption' | 'failure' | null;
}

export interface CapturedSegment {
  segmentId: string;
  sessionId: string;
  uri: string;
  fileName: string;
  phase: 'learning' | 'rest';
  cycle: number;
  capturedAt: string;
  durationMs: number;
  speechStartMs: number;
  speechEndMs: number;
}

export interface SessionEngineFailure {
  code:
    | 'permission-denied'
    | 'audio-source-unavailable'
    | 'audio-route-unavailable'
    | 'storage-unavailable'
    | 'service-start-not-allowed'
    | 'audio-engine-failed';
  message: string;
  recoverable: boolean;
}

export interface SessionAudioEngine {
  start(input: SessionAudioEngineStartInput): Promise<SessionEngineSnapshot>;
  pause(): Promise<SessionEngineSnapshot>;
  resume(): Promise<SessionEngineSnapshot>;
  stop(): Promise<SessionRecoveryRecord>;
  getSnapshot(): Promise<SessionEngineSnapshot | null>;

  getPendingRecovery(): Promise<SessionRecoveryRecord | null>;
  clearPendingRecovery(sessionId: string): Promise<void>;

  getUnstoredSegments(): Promise<CapturedSegment[]>;
  markSegmentsStored(segmentIds: string[]): Promise<void>;

  onStateChanged(cb: (snapshot: SessionEngineSnapshot) => void): () => void;
  onProgress(cb: (snapshot: SessionEngineSnapshot) => void): () => void;
  onSegmentCaptured(cb: (segment: CapturedSegment) => void): () => void;
  onFailure(cb: (failure: SessionEngineFailure) => void): () => void;
}
```

이벤트 listener는 `start()` 전에 등록한다.
네이티브는 명령을 받은 순서대로 실행한다.
각 명령은 작업이 끝난 뒤 Promise를 완료한다.

`notification`은 잠금화면 재생 위젯에 표시할 문구다.
네이티브 문자열 리소스를 쓰면 OS 로케일을 따라가 인앱 언어 설정이 반영되지 않으므로
(`docs/I18N.md`) JS가 해석한 문구를 넘긴다.
제목은 `recovery.word`를 그대로 쓰고, 부제목의 `%{cycle}`·`%{total}`은 네이티브가 갱신할 때마다
현재 회차로 치환한다.
문구는 `start()` 시점에 고정되므로 세션 도중 언어를 바꾸면 다음 세션부터 반영된다.

## 6. 세션 진행

### 학습 구간

1. 목표 음원을 재생한다.
2. 재생 중에는 발화 파일을 만들지 않는다.
3. 재생이 끝나면 음원 길이만큼 따라하기 시간을 시작한다.
4. 따라하기 시간에는 음성을 감지하고 발화 파일을 만든다.
5. 따라하기 시간이 끝나면 다시 목표 음원을 재생한다.

목표 음원 재생, 따라하기 시간, 학습 구간 종료 중 가장 먼저 끝나는 작업을 기준으로 다음 상태를 정한다.
학습 구간이 재생 도중 끝나면 재생을 멈추고 휴식 구간으로 넘어간다.
학습 구간이 따라하기 도중 끝나면 감지 중인 발화를 마무리하고 휴식 구간으로 넘어간다.
`totalDurationMs`에 도달하면 회차 중간이라도 세션을 끝낸다.
마지막 회차는 일부만 진행될 수 있다.

### 휴식 구간

휴식 구간에서는 목표 음원을 재생하지 않는다.
마이크 입력을 계속 읽고 발화를 감지할 때마다 파일을 만든다.
휴식 구간이 끝나면 감지 중인 발화를 마무리하고 다음 학습 구간으로 넘어간다.

### 완료

전체 세션 시간이 끝나면 `completed` 상태를 보낸다.
종료 사유는 `duration-reached`로 저장한다.
JS는 완료한 회차와 학습 시간을 기존 학습 기록에 반영한다.

진행 화면에 필요한 `onProgress` 이벤트는 최대 초당 1회 보낸다.

## 7. 음성 감지

마이크 입력은 `running` 상태에서 계속 읽는다.
오디오 입력 callback에서는 PCM frame을 ring buffer와 분석 queue에 복사한다.
음성 감지, WAV encoding, 파일 저장은 별도 queue에서 실행한다.

녹음 파일은 16kHz, mono, signed 16-bit PCM WAV로 통일한다.
입력 장치가 다른 형식을 제공하면 분석 queue에서 변환한다.

VAD가 발화 시작을 판단하기까지 시간이 걸리므로 직전 소리를 pre-roll ring buffer에 보관한다.
현재 JS VAD와 같은 값으로 시작한다.

| 설정 | 초기값 |
|---|---|
| 분석 간격 | 100ms 이하 |
| dBFS 하한 | `-60` |
| dBFS 상한 | `-10` |
| 음성 기준값 | `0.35` |
| 발화 시작 판단 | 기준값을 300ms 이상 연속 초과 |
| 발화 종료 판단 | 기준값 아래에서 500ms 이상 유지 |
| pre-roll | 최소 500ms |
| echo 무시 시간 | 200ms |
| 파일 하나의 최대 길이 | 30초 |

각 frame의 RMS를 dBFS로 바꾼 뒤 `dbFloor`와 `dbCeil` 사이의 0부터 1 값으로 변환한다.
Swift와 Kotlin은 `SessionVadConfig`로 받은 같은 계산 기준을 사용한다.

다음 값은 실제 기기에서 측정해 정한다.

- 한 발화의 최대 길이
- 긴 발화를 여러 파일로 나누는 기준
- 목표 음원 재생 후 speaker echo를 무시할 시간
- 입력 장치별 gain 차이
- 주변 소음에 맞춘 기준값 보정 방식
- 파일 저장이 밀릴 때 녹음을 중단할 조건

구간이 끝나거나 사용자가 일시정지할 때 발화 시작을 이미 감지했다면 해당 발화를 파일로 저장한다.
발화 시작 전의 pre-roll만 남아 있다면 파일을 만들지 않는다.

## 8. 발화 파일 저장

네이티브는 다음 순서로 발화 파일을 저장한다.

1. `captureDirectoryUri` 아래에 임시 파일을 만든다.
2. WAV 쓰기와 close를 마친다.
3. 임시 파일명과 최종 파일명을 미처리 캡처 목록에 저장한다.
4. 임시 파일을 최종 파일명으로 변경한다.
5. 목록 항목을 전달 가능 상태로 변경한다.
6. `onSegmentCaptured` 이벤트를 보낸다.

이벤트가 누락돼도 미처리 캡처 목록에서 파일 정보를 다시 읽을 수 있다.
JS는 세션 시작, foreground 복귀, 이벤트 수신 시점에 `getUnstoredSegments()`를 호출한다.

엔진을 시작할 때 임시 파일과 미처리 캡처 목록을 맞춘다.
목록에 등록된 임시 파일은 최종 파일명으로 변경한 뒤 전달 가능 상태로 바꾼다.
목록에 없는 임시 파일은 삭제한다.
목록에 기록된 임시 파일과 최종 파일이 모두 없으면 해당 항목을 삭제하고 오류를 기록한다.

기존 `FollowAlongCapture`에는 다음 값이 필요하다.

| 기존 필드 | 값 |
|---|---|
| `id` | `segmentId` |
| `sessionId` | 네이티브 이벤트의 `sessionId` |
| `wordId` | 현재 세션의 `wordId` |
| `cycle` | 네이티브 이벤트의 `cycle` |
| `phase` | 네이티브 이벤트의 `phase` |
| `capturedAt` | 네이티브 이벤트의 `capturedAt` |
| `uri` | 네이티브 이벤트의 `uri` |
| `fileName` | 네이티브 이벤트의 `fileName` |
| `segments` | `speechStartMs`와 `speechEndMs`로 생성 |
| `uploaded` | `false` |

`appendFollowAlongCapture`는 현재 저장 오류를 내부에서 기록하고 Promise를 정상 완료한다.
이 상태에서는 JS가 저장 성공 여부를 알 수 없다.
저장에 실패하면 Promise가 reject되거나 성공 여부를 반환하도록 변경한다.

JS는 `appendFollowAlongCapture`가 성공한 ID만 `markSegmentsStored()`에 전달한다.
저장에 실패한 항목은 미처리 캡처 목록에 남겨 다음 실행에서 다시 시도한다.
`segmentId`를 기존 store key로 사용하므로 같은 항목을 다시 저장해도 하나만 남는다.

기존 로컬 보관 한도는 500MB다.
JS가 실행되지 않는 동안에도 파일이 계속 쌓일 수 있으므로 네이티브에도 `maxPendingCaptureBytes`를 적용한다.
한도를 넘으면 가장 오래된 미처리 파일과 해당 목록 항목을 함께 삭제한다.

## 9. 비정상 종료 복구

세션 진행 상태는 네이티브가 직접 저장한다.
임시 파일에 먼저 쓴 뒤 최종 파일명으로 변경해 저장 도중 앱이 종료돼도 이전 기록을 남긴다.

다음 시점에 진행 상태를 저장한다.

- 세션 시작 완료
- 15초 간격
- 학습 구간과 휴식 구간 전환
- 일시정지 직전
- 오디오 중단 직전
- 오류 종료 직전
- 사용자 종료 직전
- 정상 완료 직전

저장 내용에는 세션 ID, 단어 ID, 시작 시각, 세션 설정, 실제 진행 시간, 현재 회차, 현재 구간, 종료 사유가 포함된다.

다음 실행에서 `getPendingRecovery()`로 기록을 읽는다.
종료 사유가 `duration-reached`이면 진행 시간과 관계없이 완료 세션으로 저장한다.
사용자 종료, 오류 종료, 종료 사유가 없는 기록은 5분 이상 진행했을 때만 부분 완료 세션으로 저장한다.
5분 미만인 부분 완료 기록은 학습 store에 저장하지 않고 삭제한다.
학습 store 저장이 끝나거나 저장 대상이 아니면 `clearPendingRecovery()`로 네이티브 기록을 삭제한다.
학습 store 저장에 실패하면 기록을 남겨 다음 실행에서 다시 시도한다.

## 10. Android 구현

`AudioForegroundService`가 오디오 엔진과 세션 시간을 관리한다.
Expo 모듈은 JS 명령을 서비스에 전달하고 서비스 상태를 JS 이벤트로 전달한다.
React context가 없어도 서비스가 실행 중이면 세션을 이어 간다.

| 항목 | 구현 |
|---|---|
| foreground service type | `microphone|mediaPlayback` |
| 마이크 입력 | `AudioRecord` 전용 thread |
| 목표 음원 재생 | `AudioTrack` 또는 media3 |
| 세션 시간 | `SystemClock.elapsedRealtime()` |
| 서비스 재시작 | `START_NOT_STICKY` |
| 알림 | `MediaStyle` + `MediaSession` — 재생/일시정지, 종료 action 제공 |

마이크 입력은 기존 Expo 녹음 경로와 같은 `MediaRecorder.AudioSource.MIC`을 사용한다.
고정 RMS 임계값을 쓰는 동안에는 AGC가 빠지는 `VOICE_RECOGNITION` source를 사용하지 않는다.

목표 음원은 `USAGE_MEDIA`와 `CONTENT_TYPE_SPEECH` 속성으로 재생한다.
세션을 시작할 때 audio focus를 요청하고 세션을 끝낼 때 반납한다.
일시적인 audio focus 상실에는 재생과 녹음을 멈추고 service는 유지한다.
audio focus를 되찾으면 오디오 장치를 다시 연 뒤 세션을 이어 간다.

manifest에 다음 권한과 서비스를 선언한다.

- `RECORD_AUDIO`
- `MODIFY_AUDIO_SETTINGS`
- `POST_NOTIFICATIONS`
- `FOREGROUND_SERVICE`
- `FOREGROUND_SERVICE_MICROPHONE`
- `FOREGROUND_SERVICE_MEDIA_PLAYBACK`
- `<service android:foregroundServiceType="microphone|mediaPlayback">`

앱 화면이 보이고 `RECORD_AUDIO` 권한이 허용된 상태에서 `startForegroundService()`를 호출한다.[^android-fgs-start]
서비스는 생성된 뒤 5초 안에 `startForeground()`를 호출한다.[^android-services]
`startForeground()`에는 microphone과 media playback type을 모두 전달한다.
`startForeground()`가 실패하면(Android 14+ mic 타입 while-in-use 검사 등) 세션 시작 실패로
강등하고 서비스를 즉시 중지한다 — 앱 크래시로 전파하지 않는다.

Android 13 이상에서는 세션 시작 화면에서 `POST_NOTIFICATIONS` 권한을 요청한다.
사용자가 거부해도 `foreground service`는 시작할 수 있다.
이때 서비스 알림은 notification drawer에 표시되지 않고 Task Manager에만 표시된다.[^android-notifications]

알림의 종료 action은 JS 실행 여부와 관계없이 서비스에서 세션을 끝낸다.
종료 action은 진행 상태를 저장하고 recorder, player, audio focus, 알림을 해제한다.
일시정지 상태에서는 알림을 밀어 없앨 수 있으므로 `deleteIntent`도 종료 action과 같게 처리한다.
그러지 않으면 화면에도 알림에도 보이지 않는 세션이 서비스만 붙들고 남는다.

알림은 `androidx.media3.session.MediaSession`을 붙인 `MediaStyle`로 그려 잠금화면과 빠른 설정의
미디어 영역에 표시한다.
MediaSession에 붙이는 `Player`는 목표 음원을 재생하는 `ExoPlayer`가 아니라 학습 세션 전체를
한 곡처럼 표현하는 `SimpleBasePlayer` 구현이다.

- 실제 재생은 몇 초짜리 클립을 따라하기 공백을 두고 반복하고 휴식 구간에는 멈춘다.
  `ExoPlayer`를 그대로 노출하면 재생 상태가 몇 초마다 깜빡이고 진행바가 세션 진행률이 아니라
  클립 안의 위치를 가리킨다.
- `ExoPlayer`는 오디오를 열 때마다 새로 만들고 멈출 때 해제하므로, 일시정지를 오가는 동안
  살아 있어야 하는 MediaSession의 수명주기와 맞지 않는다.

가상 플레이어는 duration에 세션 전체 길이를, position에 세션 경과 시간을 노출하고
탐색(seek)과 트랙 이동 command는 제공하지 않는다.
엔진 상태가 바뀔 때만 알림을 다시 발행하고, 마지막으로 그린 값과 같으면 건너뛴다.
위치는 MediaSession이 폴링하므로 초당 갱신이 필요 없다.

알림 액션과 MediaSession 명령은 전용 스레드에서 엔진을 호출한다.
메인 스레드에서 호출하면 오디오 장치를 여는 동안(최대 4초) UI가 멈춘다.

Android 15는 `dataSync`와 `mediaProcessing`을 24시간 동안 총 6시간까지 허용한다.
`microphone`과 `mediaPlayback`에는 이 시간 제한이 없다.[^android-fgs-types]
사용자 중지와 OS의 프로세스 종료는 별도 조건이므로 실제 기기에서 장시간 실행을 확인한다.

## 11. iOS 구현

세션 동안 `AVAudioSession.Category.playAndRecord`와 `.default` mode를 사용한다.
category option에는 `.defaultToSpeaker`와 `.allowBluetoothHFP`를 적용한다.
내장 장치를 사용할 때는 speaker로 재생한다.
Bluetooth HFP를 사용할 때는 같은 장치로 재생하고 녹음한다.[^apple-bluetooth]
`UIBackgroundModes`에는 `audio`를 선언한다.[^apple-background][^expo-audio]

`AVAudioEngine` input node에서 마이크 입력을 읽는다.
`AVAudioPlayerNode`로 목표 음원을 재생한다.
두 기능은 같은 `AVAudioEngine` 구성에서 실행한다.

오디오 interruption이 시작되면 세션 시간을 멈추고 `interrupted` 상태를 보낸다.
interruption이 끝나면 `shouldResume`, 마이크 권한, 현재 오디오 경로를 확인한다.[^apple-interruptions]
오디오 엔진을 다시 시작한 뒤 성공한 경우에만 세션 시간을 이어 간다.

오디오 경로의 sample rate나 channel count가 바뀌면 input tap과 converter를 다시 만든다.
route change 통지는 장치 연결/해제(`newDeviceAvailable`/`oldDeviceUnavailable`) reason만 처리한다.
category 변경 등 세션 자신이 유발하는 통지에 반응하면 엔진 재구성이 반복되므로 무시한다.
capture manifest와 복구 기록 접근은 coordinator 직렬 큐로 직렬화한다.
캡처 파이프라인과 JS 호출이 서로 다른 스레드에서 같은 저장소에 닿기 때문이다.
media services reset이 발생하면 `AVAudioSession`과 `AVAudioEngine`을 처음부터 다시 구성한다.

speaker로 목표 음원을 재생하면서 microphone을 열면 재생음이 마이크에 들어간다.
재생 중에는 발화 파일을 만들지 않는다.
재생이 끝난 뒤 남는 echo를 얼마나 무시할지는 실제 기기에서 측정한다.

### 잠금화면 재생 위젯

iOS에는 상주 알림이 없으므로 Android의 `MediaStyle` 알림에 대응하는 자리가
잠금화면과 제어센터의 Now Playing 위젯이다.

`MPNowPlayingInfoCenter`에 제목(단어), 부제목(구간·회차), 세션 전체 길이, 경과 시간,
재생 속도를 싣는다.
재생 위치는 시스템이 경과 시간과 재생 속도로 외삽하므로 매초 갱신하지 않고
상태 전이와 구간 전환에서만 갱신한다.

`MPRemoteCommandCenter`에는 재생, 일시정지, 재생/일시정지 토글, 정지만 활성화한다.
세션은 단어 하나짜리이고 경과 시간이 학습 기록의 근거이므로
트랙 이동과 재생 위치 변경 command는 비활성화한다.

원격 커맨드는 메인 스레드로 도착하므로 coordinator의 직렬 큐로 넘겨 실행한다.
큐 안에서 다시 `queue.sync`를 부르면 같은 직렬 큐에서 자기 자신을 기다려 교착되므로,
공개 메서드(`pause`/`resume`/`stop`)와 큐 위에서 도는 내부 구현을 분리한다.

세션이 끝나면 Now Playing 정보를 비우고 원격 커맨드를 해제한다.

## 12. 앱 연동

| 기존 코드 | 변경 |
|---|---|
| `use-session-audio-player.ts` | 세션 엔진으로 교체 |
| `use-follow-along-vad.ts` | 제거 |
| `use-rest-vad.ts` | 제거 |
| `use-follow-along-capture.ts` | 네이티브 발화 정보를 기존 저장 타입으로 변환 |
| `use-rest-phrase-capture.ts` | 네이티브 발화 정보를 기존 저장 타입으로 변환 |
| `use-active-session.ts` | 엔진 명령과 진행 이벤트 연결 |
| `session-reducer.ts` | 네이티브 진행 상태를 화면 상태로 반영 |
| `session-cycle-model.ts` | 마지막 회차가 일부만 진행되는 경우 계산 |
| `active-session-storage.ts` | 네이티브 중단 기록을 읽는 방식으로 교체 |
| `follow-along-capture-storage.ts` | 저장 성공 여부를 호출자에게 반환 |

화면의 일시정지 버튼은 `engine.pause()`를 호출한다.
다시 시작 버튼은 `engine.resume()`을 호출한다.
종료 버튼은 `engine.stop()` 결과를 학습 기록에 반영한다.

잠금화면에서 일시정지·재개하면 네이티브가 `onStateChanged`를 보내므로 화면이 따라온다.
반대로 네이티브 주도 **종료**는 세션이 사라져 이벤트를 보낼 대상이 없으므로,
foreground 복귀 시 `getSnapshot()`이 `null`인 것으로 판정한다 (`use-active-session.ts`).

진행 중 세션은 학습 탭에도 배너로 보인다 (`components/session/running-session-banner.tsx`).
`useActiveSession`은 `start()`를 소유하고 자기 `sessionId`로 스냅샷을 걸러내므로 학습 화면
바깥에서 쓸 수 없다. 배너는 명령을 보내지 않고 구독만 하는 별도 훅
(`features/training/hooks/use-running-session-watcher.ts`)을 쓴다.

## 13. 구현 순서

1. `jest-expo` test runner 설정[^expo-jest]
   - `npx expo install jest-expo jest @types/jest --dev`
   - `package.json`에 test script와 `jest-expo` preset 추가
2. JS API와 test engine 구현
   - 상태 변경과 오류 동작을 JS 단위 테스트로 확인
3. preset asset을 로컬 파일 URI로 바꾸는 코드 구현
4. 발화 파일 저장 결과를 반환하도록 기존 저장 함수 변경
5. 로컬 Expo 모듈 생성
   - `npx create-expo-module --local session-audio-engine`
6. iOS 세션 시간과 재생 구현
7. iOS 연속 녹음과 VAD 구현
8. iOS 오디오 중단 복구 구현
9. Android foreground service와 세션 시간 구현
10. Android 연속 녹음과 VAD 구현
11. Android 알림 종료 action 구현
12. 네이티브 진행 상태 저장과 다음 실행 복구 구현
13. 기존 세션 화면 연결
14. 장시간 테스트와 실패 상황 테스트
15. Play Console과 App Store 제출 정보 작성

## 14. 테스트 항목

### 공통

- 3시간 preset의 회차와 구간 계산
- 23시간 59분 설정의 회차와 구간 계산
- 일시정지 시간 제외
- 전화나 audio focus 상실 시간 제외
- 정상 완료 기록 중복 방지
- 사용자 종료 기록 중복 방지
- 프로세스 종료 후 마지막 진행 상태 복구
- 저장 공간 부족 시 오류 기록과 세션 종료
- microphone 권한 철회 시 오류 기록과 세션 종료
- 목표 음원 재생 중 발화 파일 생성 방지
- speaker echo가 발화 파일에 포함되는지 확인

### Android

- Android 12, 14, 15에서 화면 잠금 후 재생과 녹음 유지
- 시작 탭 직후 즉시 화면 잠금/홈 전환 시 크래시 없이 시작 실패 또는 정상 진행
- 백그라운드 service 시작 요청 거부
- 알림 종료 action 처리
- 잠금화면·빠른 설정 미디어 영역에 단어·구간·회차·진행바 표시
- 일시정지 후에도 알림이 남고 백그라운드 상태에서 재생 action 으로 재개
- 일시정지 상태에서 알림을 밀어 없애면 세션 종료
- 일시정지 중 마이크 프라이버시 인디케이터 해제
- task manager에서 앱을 중지했을 때 처리
- recent task 제거 후 service 동작
- Doze 상태에서 세션 시간과 녹음 유지
- 제조사 배터리 절약 모드에서 동작
- 3시간 실행 후 메모리와 파일 descriptor 증가 여부

### iOS

- 화면 잠금 후 재생과 녹음 유지
- 다른 앱으로 전환한 뒤 재생과 녹음 유지
- 잠금화면·제어센터 Now Playing 에 단어·구간·회차 표시
- 일시정지한 채 백그라운드로 둔 뒤에도 잠금화면 재생 버튼으로 재개
- 일시정지 중 마이크 인디케이터 해제
- 전화 종료 후 세션 재개
- Siri 종료 후 세션 재개
- 유선 오디오 장치 연결과 해제
- Bluetooth 오디오 장치 연결과 해제
- media services reset 후 엔진 재구성
- input tap과 이벤트 중복 방지
- 3시간 실행 후 메모리와 파일 descriptor 증가 여부

현재 프로젝트에는 test runner가 없다.
구현 첫 단계에서 `jest-expo`를 설정한 뒤 상태 계산과 저장 변환을 단위 테스트로 확인한다.[^expo-jest]
백그라운드 오디오와 OS 동작은 실제 기기에서 확인한다.

## Sources

Expo SDK 54와 `expo-audio` 1.1.1을 기준으로 확인했다.
Android Developers, Apple Developer, Expo, React Native의 공식 문서 12개와 Expo GitHub 소스 2개를 확인했다.

[^android-fgs-types]: [Foreground service types](https://developer.android.com/develop/background-work/services/fgs/service-types), 2026-07-12 조회, Official docs, Android 12 이상과 Android 15 제한 적용
[^android-fgs-start]: [Restrictions on starting a foreground service from the background](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start), 2026-06-18 갱신, Official docs, Android 12 이상과 Android 14 이상 권한 검사 적용
[^apple-background]: [Configuring background execution modes](https://developer.apple.com/documentation/xcode/configuring-background-execution-modes), 2026-07-12 조회, Official docs, iOS와 iPadOS 적용
[^apple-interruptions]: [Handling audio interruptions](https://developer.apple.com/documentation/avfaudio/handling-audio-interruptions), 2026-07-12 조회, Official docs, AVFAudio 적용
[^expo-audio]: [Audio](https://docs.expo.dev/versions/v54.0.0/sdk/audio/), 2026-07-12 조회, Official docs, Expo SDK 54와 `expo-audio` 1.1.1 적용
[^expo-local-module]: [Create a module with Expo Modules API](https://docs.expo.dev/more/create-expo-module/), 2026-07-12 조회, Official docs, Expo SDK 54 적용
[^expo-autolinking]: [Expo Autolinking](https://docs.expo.dev/modules/autolinking/), 2026-06-11 갱신, Official docs, Expo SDK 54 적용
[^react-native-timers]: [Timers](https://reactnative.dev/docs/timers), 2026-05-26 갱신, Official docs, React Native 0.81 적용
[^expo-recorder-source]: [AudioRecorder.kt](https://github.com/expo/expo/blob/sdk-54/packages/expo-audio/android/src/main/java/expo/modules/audio/AudioRecorder.kt), 2026-07-12 조회, GitHub 50.4k stars, Expo SDK 54 소스
[^expo-recording-service-source]: [AudioRecordingService.kt](https://github.com/expo/expo/blob/sdk-54/packages/expo-audio/android/src/main/java/expo/modules/audio/service/AudioRecordingService.kt), 2026-07-12 조회, GitHub 50.4k stars, Expo SDK 54 소스
[^android-notifications]: [Notification runtime permission](https://developer.android.com/develop/ui/compose/notifications/notification-permission), 2026-06-18 갱신, Official docs, Android 13 이상 적용
[^apple-bluetooth]: [allowBluetoothHFP](https://developer.apple.com/documentation/avfaudio/avaudiosession/categoryoptions-swift.struct/allowbluetoothhfp), 2026-07-12 조회, Official docs, AVFAudio Bluetooth HFP 경로 적용
[^android-services]: [Services overview](https://developer.android.com/develop/background-work/services), 2026-07-12 조회, Official docs, Android foreground service 시작 시간 적용
[^expo-jest]: [Unit testing with Jest](https://docs.expo.dev/develop/unit-testing/), 2026-06-30 갱신, Official docs, Expo SDK 54 테스트 설정 적용

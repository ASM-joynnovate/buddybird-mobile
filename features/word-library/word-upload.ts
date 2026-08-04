// 단어 업로드 flush 오케스트레이터 (SPEC-0003 §단어 업로드).
// 트리거 3종은 두 진입점으로 나뉜다 — 단어 생성은 그 1건만(`requestWordUpload`),
// 콜드 스타트·동의 granted 전환은 전체(`requestWordUploadFlush`). 둘 다
// fire-and-forget single-flight 다. 클립 업로드와는 독립으로 동작한다 (BB-238 §제외).
//
// 첫 배포에는 처리 기록(전송 이력)을 두지 않는다 (BB-238 결정). 서버에서 데이터가 지워졌을 때
// 클라이언트가 재전송하지 못해 누락이 고착되는 것을 막기 위한 선택이며, 대신 콜드 스타트마다
// 전량을 다시 보낸다. 4xx 로 거부된 단어도 매번 다시 보낸다 — 재전송을 거르는 규칙은
// 다음 업데이트에서 논의해 넣는다.

import { Platform } from 'react-native';

import { reportError } from '@/features/analytics/error-reporter';
import { hydrateAudioUriFromStorage, recordingFileExists } from '@/features/audio/audio-file-storage';
import { getCurrentUid } from '@/features/auth/auth-identity';
import { readExtraString } from '@/features/shared/expo-extra';
import { isUploadGateOpen } from '@/features/training/follow-along-upload-gate';
import { loadUploadConsent } from '@/features/upload-consent/upload-consent-storage';

import { loadWordLibraryStore } from './word-library-storage';
import type { WordEntry } from './word-library-types';
import { sendWord } from './word-upload-client';
import { interpretWordUploadResult } from './word-upload-response';
import { mergeUploadTargets, selectUploadableWords, type UploadTarget } from './word-upload-target';

let flushInFlight = false;
/** flush 도중 도착한 트리거의 재실행 예약. 합치는 규칙은 target 모듈이 소유한다. */
let queuedTarget: UploadTarget | null = null;

/** 트리거 ①: 단어 생성 — 생성된 단어 1건만 보낸다. */
export function requestWordUpload(wordId: string): void {
  request({ kind: 'single', wordId });
}

/** 트리거 ②③: 앱 콜드 스타트, 오디오 수집 동의 `granted` 전환 — 미처리 단어 전체를 보낸다. */
export function requestWordUploadFlush(): void {
  request({ kind: 'all' });
}

function request(target: UploadTarget): void {
  // 웹은 게이트 판정에 쓰는 Firebase auth(getApp)가 미지원이라 판정 전에 throw 난다 —
  // 배선 지점마다 가드를 두는 대신 진입점에서 차단한다 (spec 대상 플랫폼도 iOS·Android 뿐).
  if (Platform.OS === 'web') return;

  if (flushInFlight) {
    queuedTarget = mergeUploadTargets(queuedTarget, target);
    return;
  }

  flushInFlight = true;
  runUploadLoop(target)
    .catch((error: unknown) => {
      reportError(error, { scope: 'word-library.uploadFlush' });
    })
    .finally(() => {
      flushInFlight = false;
      const queued = queuedTarget;
      queuedTarget = null;
      if (queued) request(queued);
    });
}

async function runUploadLoop(target: UploadTarget): Promise<void> {
  // 게이트는 전송 시작 전에 확인한다 — 판정의 소유자는 gate 모듈이고,
  // uid·apiBaseUrl 선제 체크는 TS 내로잉용이다.
  const consent = await loadUploadConsent();
  const uid = getCurrentUid();
  const apiBaseUrl = readExtraString('apiBaseUrl');
  if (!uid || !apiBaseUrl) return;
  if (!isUploadGateOpen({ consentStatus: consent.status, uid, apiBaseUrl })) return;

  const library = await loadWordLibraryStore();
  const uploadable = selectUploadableWords(Object.values(library.entriesById));
  const targets =
    target.kind === 'single' ? uploadable.filter((entry) => entry.id === target.wordId) : uploadable;

  // 요청은 언제나 동시에 1건씩만 보낸다 (SPEC-0003 §요청 전송).
  for (const entry of targets) {
    const audioUri = resolveReferenceAudioUri(entry);
    if (audioUri === null) continue;

    const outcome = interpretWordUploadResult(
      await sendWord({ apiBaseUrl, uid, clientWordId: entry.id, label: entry.label, audioUri }),
    );

    // 5xx·네트워크 오류는 이 실행을 중단하고 다음 트리거에서 재시도한다 (SPEC-0003 §실패).
    if (outcome.kind === 'halt') return;

    // 4xx 는 거부를 알리기만 하고 다음 단어로 넘어간다. 처리 기록이 없어 다음 트리거에서
    // 다시 보내므로, 같은 단어의 거부가 리포팅에 반복해 쌓인다.
    if (outcome.kind === 'failed') {
      reportError(new Error(`word upload rejected with 4xx: ${entry.id}`), {
        scope: 'word-library.uploadFlush.rejected',
      });
    }
  }
}

// 기준 음성 파일이 없으면 보낼 것이 없다. 처리 기록을 남기지 않아 다음 트리거에서 다시 보는데,
// 파일 존재 확인만 하고 넘어가므로 비용이 없다. 단어 데이터는 사용자 것이라 여기서 지우지 않는다.
function resolveReferenceAudioUri(entry: WordEntry): string | null {
  const audioUri = hydrateAudioUriFromStorage(entry.audioUri);
  if (!audioUri || !recordingFileExists(audioUri)) {
    console.warn('[word-library.uploadFlush]', `reference audio missing for ${entry.id}`);
    return null;
  }
  return audioUri;
}

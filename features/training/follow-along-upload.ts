// 캡처 업로드 flush 오케스트레이터 (SPEC-0003 §오디오 클립 업로드).
// 트리거 5종(누적·세션 종료·포그라운드·네트워크 복구·동의 전환)은 전부 fire-and-forget
// `requestCaptureFlush()` 하나로 수렴한다 — 진행 중이면 종료 후 재실행 예약(single-flight),
// 세션 경험에 개입하지 않는다 (NFR-01). 루프: 게이트 재확인 → 잔여 zip 청소 → 백필 → 배치 조립
// → 전송 → 항목 처리 → 큐가 남고 게이트가 유지되면 반복.

import * as Application from 'expo-application';
import { Platform } from 'react-native';

import { reportError } from '@/features/analytics/error-reporter';
import { trackEvent } from '@/features/analytics/event-tracker';
import type { CaptureFlushAbortReason } from '@/features/analytics/events';
import { recordingFileExists } from '@/features/audio/audio-file-storage';
import { getCurrentUid } from '@/features/auth/auth-identity';
import { loadStoredProfile } from '@/features/profile/profile-storage';
import { readExtraString } from '@/features/shared/expo-extra';
import { loadUploadConsent } from '@/features/upload-consent/upload-consent-storage';

import { buildCaptureRegistrationMeta, type CaptureRegistrationMeta } from './follow-along-capture-meta';
import { applyCaptureMeta, deleteCaptures, loadFollowAlongCaptures } from './follow-along-capture-storage';
import type { FollowAlongCapture } from './follow-along-capture-types';
import {
  buildCaptureBatchMetadata,
  type CaptureUploadMetadataItem,
  planCaptureBatch,
} from './follow-along-upload-batch';
import { cleanupCaptureUploadArtifacts, sendCaptureBatch } from './follow-along-upload-client';
import { isUploadGateOpen } from './follow-along-upload-gate';
import { type CaptureBatchOutcome, interpretCaptureBatchResult } from './follow-along-upload-response';
import { loadTrainingStore } from './training-storage';

let flushInFlight = false;
// flush 도중 도착한 트리거의 재실행 예약. 루프가 배치마다 스토어를 재읽으므로 성공 진행 중의
// 신규 클립은 같은 실행이 집어가지만, halt(5xx·네트워크) 직전 도착분은 이번 실행이 못 본다 —
// 종료 후 1회 재기동해 트리거의 "즉시 전송" 보장을 지킨다. 예약은 트리거 종류를 보존한다:
// 누적(①)만으로 예약된 rerun 은 누적 취급이라 halt 후엔 억제된다 — 안 그러면 전송 대기
// (최대 timeout 60초) 중 유입되는 캡처마다 rerun 이 억제를 풀어 재압축 사슬이 된다.
let rerunRequested = false;
let rerunFromAccumulationOnly = true;
// 일시 장애(5xx·네트워크 오류·해석 불가 응답)로 halt 한 사실의 기억. 서 있는 동안 누적
// 트리거(①)의 재시도만 억제한다 — 오프라인 세션에서 캡처 저장마다 같은 배치를 재압축·재전송
// 하는 낭비를 막는다 (NFR-01). 나머지 트리거(②~⑤)는 상황 변화 신호라 플래그를 풀고 진행한다.
// 클립은 큐에 그대로 남으므로 데이터 손실은 없다 (SPEC-0003 §실패 — 각주 참조).
let haltedByTransientFailure = false;
// 진행 중 flush 1회의 계측 누계 (BB-284). single-flight 가 동시 실행을 막으므로 모듈 레벨에
// 둔다 — 정상 halt 와 예외 종료가 같은 값을 읽는다.
let flushSucceededCount = 0;
let flushPendingCount = 0;

/** flush 를 중단시킨 사유. 대기 건수·성공 건수는 모듈 누계에서 읽으므로 여기 담지 않는다. */
interface FlushAbort {
  reason: CaptureFlushAbortReason;
  httpStatus?: number;
}

function abortWith(reason: CaptureFlushAbortReason, httpStatus: number | null): FlushAbort {
  return { reason, ...(httpStatus === null ? {} : { httpStatus }) };
}

/**
 * 모든 업로드 트리거의 단일 진입점. 진행 중이면 종료 후 1회 재실행을 예약한다.
 * 누적 트리거(①)는 `fromAccumulation` 을 표시한다 — 직전 flush 가 일시 장애로 중단된
 * 상태에서는 no-op 이 된다 (상황 변화 트리거 ②~⑤가 오면 억제가 풀린다).
 */
export function requestCaptureFlush(options?: { fromAccumulation?: boolean }): void {
  // 웹은 게이트 판정에 쓰는 Firebase auth(getApp)가 미지원이라 판정 전에 throw 난다 —
  // 배선 지점마다 가드를 두는 대신 진입점에서 차단한다 (spec 대상 플랫폼도 iOS·Android 뿐).
  if (Platform.OS === 'web') return;
  if (options?.fromAccumulation && haltedByTransientFailure) return;
  haltedByTransientFailure = false;
  if (flushInFlight) {
    rerunRequested = true;
    if (!options?.fromAccumulation) rerunFromAccumulationOnly = false;
    return;
  }
  flushInFlight = true;
  runFlushLoop()
    .then((abort) => {
      // 중단 기록은 halt 지점마다가 아니라 여기 한 곳에서 낸다 — flush 단위 1회 계약 (BB-284).
      if (!abort) return;
      haltedByTransientFailure = true;
      trackFlushAborted(abort);
    })
    .catch((error: unknown) => {
      // 예외로 죽은 실패(디스크 가득 참의 zip 쓰기 throw 등)도 정상 halt 와 같은 억제 계약을
      // 따른다 — 안 세우면 캡처 저장마다 누적 트리거가 같은 실패(재압축 포함)를 반복한다.
      haltedByTransientFailure = true;
      trackFlushAborted({ reason: 'exception' });
      reportError(error, { scope: 'training.captureFlush' });
    })
    .finally(() => {
      flushInFlight = false;
      if (rerunRequested) {
        const fromAccumulation = rerunFromAccumulationOnly;
        rerunRequested = false;
        rerunFromAccumulationOnly = true;
        requestCaptureFlush(fromAccumulation ? { fromAccumulation: true } : undefined);
      }
    });
}

async function runFlushLoop(): Promise<FlushAbort | null> {
  flushSucceededCount = 0;
  flushPendingCount = 0;

  for (;;) {
    // 게이트는 배치마다 재확인한다 — flush 도중 동의 철회 등 상태 변화를 존중.
    // uid·apiBaseUrl 선제 체크는 TS 내로잉용 — 판정의 소유자는 gate 모듈이다.
    const consent = await loadUploadConsent();
    const uid = getCurrentUid();
    const apiBaseUrl = readExtraString('apiBaseUrl');
    if (!uid || !apiBaseUrl) return null;
    if (!isUploadGateOpen({ consentStatus: consent.status, uid, apiBaseUrl })) return null;

    const store = await loadFollowAlongCaptures();
    const captures = await backfillLegacyCaptureMeta(Object.values(store.capturesById));
    if (captures.length === 0) return null;
    flushPendingCount = captures.length;

    const plan = planCaptureBatch(captures, (capture) => recordingFileExists(capture.uri));
    if (plan.missingFileIds.length > 0) {
      await deleteCaptures(plan.missingFileIds);
      flushPendingCount -= plan.missingFileIds.length;
    }
    if (plan.batch.length === 0) return null;

    cleanupCaptureUploadArtifacts();
    const metadata = buildCaptureBatchMetadata(plan.batch, Application.nativeApplicationVersion);
    const send = await sendCaptureBatch({ apiBaseUrl, uid, batch: plan.batch, metadata });
    if (send.unreadableIds.length > 0) {
      // 읽을 수 없는 파일은 "파일 없음"과 동일 — 삭제해야 배치 선두 고착이 안 생긴다.
      console.warn('[training.captureFlush]', `deleting unreadable captures: ${send.unreadableIds.join(', ')}`);
      await deleteCaptures(send.unreadableIds);
      flushPendingCount -= send.unreadableIds.length;
    }
    if (!send.http) continue; // 전송할 파일이 없었다 — 실패분 삭제 후 다음 배치로.
    const outcome = interpretCaptureBatchResult(send.http, send.sentIds);

    if (outcome.kind === 'halt') return abortWith(outcome.reason, send.http.status);

    // 읽기 실패분을 뺀 "실제 전송된 것"이 이후 분기의 공통 기준이다 — 계획 배치를 쓰면
    // 계측의 batch_size 가 부풀고 응답 해석 기준(sentIds)과도 어긋난다.
    const sentIdSet = new Set(send.sentIds);
    const sentBatch = plan.batch.filter((capture) => sentIdSet.has(capture.id));

    if (outcome.kind === 'processed') {
      const progressed = await applyProcessedOutcome(outcome, sentBatch, false);
      if (!progressed) return abortWith('unreadable_response', send.http.status);
      continue;
    }

    if (outcome.kind === 'discard') {
      for (const capture of sentBatch) {
        await discardRejectedCapture(capture, send.http.status);
      }
      continue;
    }

    // split: 실제 전송된 것만 1건씩 쪼개 재전송. 5xx·네트워크 오류를 만나면 flush 전체를 중단한다.
    const sentMetadata = metadata.filter((_, index) => sentIdSet.has(plan.batch[index].id));
    const abort = await resendIndividually(sentBatch, sentMetadata, apiBaseUrl, uid);
    if (abort) return abort;
  }
}

async function resendIndividually(
  batch: readonly FollowAlongCapture[],
  metadata: readonly CaptureUploadMetadataItem[],
  apiBaseUrl: string,
  uid: string,
): Promise<FlushAbort | null> {
  for (let i = 0; i < batch.length; i += 1) {
    const capture = batch[i];
    const send = await sendCaptureBatch({
      apiBaseUrl,
      uid,
      batch: [capture],
      metadata: [metadata[i]],
    });
    if (send.unreadableIds.length > 0) {
      await deleteCaptures(send.unreadableIds);
      flushPendingCount -= send.unreadableIds.length;
    }
    if (!send.http) continue; // 그 사이 파일이 사라짐 — 삭제 후 다음 단건으로.
    const outcome = interpretCaptureBatchResult(send.http, send.sentIds);
    if (outcome.kind === 'halt') return abortWith(outcome.reason, send.http.status);
    if (outcome.kind === 'processed') {
      // 단건에서도 해소 0건이면 외부 루프와 같은 원칙으로 flush 전체를 중단한다 —
      // 안 그러면 외부 루프가 같은 배치를 재조립해 4xx→split→빈 200 무한 루프가 된다.
      const progressed = await applyProcessedOutcome(outcome, [capture], true);
      if (!progressed) return abortWith('unreadable_response', send.http.status);
      continue;
    }
    // 1건 배치라 split 은 나올 수 없다 — discard 만 남는다.
    await discardRejectedCapture(capture, send.http.status);
  }
  return null;
}

// processed 응답의 항목 처리: rejected 경고 + 해소분(success·rejected) 삭제.
// 해소 0건(malformed 응답 등)이면 false — 같은 배치를 곧장 재전송하는 무한 루프가
// 되므로 호출부는 flush 를 중단해야 한다.
async function applyProcessedOutcome(
  outcome: Extract<CaptureBatchOutcome, { kind: 'processed' }>,
  batch: readonly FollowAlongCapture[],
  isRetrySingle: boolean,
): Promise<boolean> {
  const capturedAtById = new Map(batch.map((capture) => [capture.id, capture.capturedAt]));
  const now = Date.now();

  for (const id of outcome.successIds) {
    const capturedAt = capturedAtById.get(id);
    if (capturedAt === undefined) continue;
    trackEvent({
      name: 'capture_upload_succeeded',
      params: {
        client_capture_id: id,
        latency_ms: now - Date.parse(capturedAt),
        batch_size: batch.length,
        is_retry_single: isRetrySingle,
      },
    });
  }

  if (outcome.rejectedIds.length > 0) {
    console.warn('[training.captureFlush]', `server rejected captures: ${outcome.rejectedIds.join(', ')}`);
    for (const id of outcome.rejectedIds) {
      const capturedAt = capturedAtById.get(id);
      if (capturedAt === undefined) continue;
      // 항목 rejected 는 200 응답이라 상태 코드가 없다 — 단건 4xx 폐기와 여기서 갈린다.
      trackEvent({
        name: 'capture_upload_failed',
        params: {
          client_capture_id: id,
          reason: 'server_reject',
          age_ms: now - Date.parse(capturedAt),
        },
      });
    }
  }

  const resolvedIds = [...outcome.successIds, ...outcome.rejectedIds];
  if (resolvedIds.length === 0) return false;
  await deleteCaptures(resolvedIds);
  flushSucceededCount += outcome.successIds.length;
  flushPendingCount -= resolvedIds.length;
  return true;
}

// 단건에서도 4xx 로 거부된 클립은 폐기하고 보고한다 (SPEC-0003 §실패).
async function discardRejectedCapture(
  capture: FollowAlongCapture,
  httpStatus: number | null,
): Promise<void> {
  await deleteCaptures([capture.id]);
  flushPendingCount -= 1;
  trackEvent({
    name: 'capture_upload_failed',
    params: {
      client_capture_id: capture.id,
      reason: 'server_reject',
      age_ms: Date.now() - Date.parse(capture.capturedAt),
      ...(httpStatus === null ? {} : { http_status: httpStatus }),
    },
  });
  reportError(new Error(`capture discarded after 4xx: ${capture.id}`), {
    scope: 'training.captureFlush.discard',
  });
}

function trackFlushAborted(abort: FlushAbort): void {
  trackEvent({
    name: 'capture_flush_aborted',
    params: {
      reason: abort.reason,
      pending_count: flushPendingCount,
      succeeded_before_abort: flushSucceededCount,
      ...(abort.httpStatus === undefined ? {} : { http_status: abort.httpStatus }),
    },
  });
}

// legacy 레코드(clientWordId 부재)에 등록 시점과 같은 규칙으로 메타를 보충하고 영속화한다
// (결정 ③ — 1회 보충, 이후에는 부재 레코드가 없어 no-op). 매핑 실패는 원본 wordId 강등.
async function backfillLegacyCaptureMeta(captures: FollowAlongCapture[]): Promise<FollowAlongCapture[]> {
  const legacy = captures.filter((capture) => capture.clientWordId === undefined);
  if (legacy.length === 0) return captures;

  const [trainingStore, profile] = await Promise.all([loadTrainingStore(), loadStoredProfile()]);
  const metaById: Record<string, CaptureRegistrationMeta> = {};
  for (const capture of legacy) {
    metaById[capture.id] = buildCaptureRegistrationMeta(
      capture.wordId,
      trainingStore.wordsById[capture.wordId],
      profile,
    );
  }
  await applyCaptureMeta(metaById);
  return captures.map((capture) =>
    metaById[capture.id] ? { ...capture, ...metaById[capture.id] } : capture,
  );
}

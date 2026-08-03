// 단어 전송 결과의 해석 (SPEC-0003 §단어 업로드 — 응답 처리). 순수 함수 — I/O 없음.
// 전송 자체(fetch)는 client 가 하고, 여기서는 상태 코드만 보고 다음 행동을 판정한다.

export interface WordUploadHttpResult {
  /** HTTP 상태 코드. 네트워크 오류(응답 없음)면 null */
  status: number | null;
}

export type WordUploadOutcome =
  /** 2xx — 상태 저장소에 `uploaded` 기록 */
  | { kind: 'uploaded' }
  /** 4xx — `failed` 기록, 재전송 금지, reportError */
  | { kind: 'failed' }
  /** 5xx·네트워크 오류 — 기록을 남기지 않고 다음 트리거에서 재시도 */
  | { kind: 'halt' };

export function interpretWordUploadResult(result: WordUploadHttpResult): WordUploadOutcome {
  const { status } = result;
  if (status !== null && status >= 200 && status < 300) return { kind: 'uploaded' };
  if (status !== null && status >= 400 && status < 500) return { kind: 'failed' };
  // 5xx·네트워크 오류·그 외 예상 밖 상태 — 단어를 영구 실패로 굳히지 않는 쪽으로 보수적으로 중단한다.
  return { kind: 'halt' };
}

// 단어 전송 결과의 해석 (SPEC-0003 §단어 업로드 — 응답 처리). 순수 함수 — I/O 없음.
// 전송 자체(fetch)는 client 가 하고, 여기서는 상태 코드만 보고 다음 행동을 판정한다.

export interface WordUploadHttpResult {
  /** HTTP 상태 코드. 네트워크 오류(응답 없음)면 null */
  status: number | null;
  /**
   * 거부 사유 코드 (SPEC-0002 §공통 규약의 `error_code`). 읽지 못했으면 null.
   *
   * 파일 문제 3가지가 전부 400 이라 상태 코드만으로는 원인을 가를 수 없다.
   * 판정에는 쓰지 않고 리포팅에만 쓴다.
   */
  errorCode?: string | null;
}

export type WordUploadOutcome =
  /** 2xx — 서버가 저장했다. 다음 단어로 진행 */
  | { kind: 'uploaded' }
  /** 4xx — 서버가 거부했다. reportError 후 다음 단어로 진행 */
  | { kind: 'failed' }
  /** 5xx·네트워크 오류 — 실행을 중단하고 다음 트리거에서 재시도 */
  | { kind: 'halt' };

export function interpretWordUploadResult(result: WordUploadHttpResult): WordUploadOutcome {
  const { status } = result;
  if (status !== null && status >= 200 && status < 300) return { kind: 'uploaded' };
  if (status !== null && status >= 400 && status < 500) return { kind: 'failed' };
  // 5xx·네트워크 오류·그 외 예상 밖 상태 — 거부로 단정하지 않고 중단해 다음 트리거에 맡긴다.
  return { kind: 'halt' };
}

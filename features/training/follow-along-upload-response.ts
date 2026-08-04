// 배치 전송 결과의 해석 (SPEC-0003 §응답 처리). 순수 함수 — I/O 없음.
// 전송 자체(fetch)는 client 가 하고, 여기서는 상태·본문만 보고 다음 행동을 판정한다.

export interface CaptureBatchHttpResult {
  /** HTTP 상태 코드. 네트워크 오류(응답 없음)면 null */
  status: number | null;
  /** 파싱된 JSON 본문. 파싱 실패·없음이면 null */
  body: unknown;
}

export type CaptureBatchOutcome =
  /** 200 — 항목별 처리. success·rejected 는 삭제, 응답에 없는 항목은 큐 유지 */
  | { kind: 'processed'; successIds: string[]; rejectedIds: string[]; unresolvedIds: string[] }
  /** 요청 4xx (배치 2건 이상) — 1건씩 쪼개 재전송 */
  | { kind: 'split' }
  /** 요청 4xx (1건 배치) — 그 클립 폐기 + reportError */
  | { kind: 'discard' }
  /** 5xx·네트워크 오류 — zip 만 삭제, 클립 큐 유지, flush 중단 */
  | { kind: 'halt' };

export function interpretCaptureBatchResult(
  result: CaptureBatchHttpResult,
  batchIds: readonly string[],
): CaptureBatchOutcome {
  const { status } = result;
  if (status !== null && status >= 200 && status < 300) {
    return interpretItemStatuses(result.body, batchIds);
  }
  if (status !== null && status >= 400 && status < 500) {
    return batchIds.length > 1 ? { kind: 'split' } : { kind: 'discard' };
  }
  // 5xx·네트워크 오류·그 외 예상 밖 상태 — 클립을 지우지 않는 쪽으로 보수적으로 중단한다.
  return { kind: 'halt' };
}

// 응답 data 는 client_capture_id 키 객체, 항목은 { status: 'success' | 'rejected' }.
// malformed 본문이면 전 항목 unresolved — 삭제하지 않고 다음 트리거에서 재시도한다
// (서버가 (uid, client_capture_id) 멱등이라 중복 전송은 안전).
function interpretItemStatuses(body: unknown, batchIds: readonly string[]): CaptureBatchOutcome {
  const data =
    body && typeof body === 'object' ? (body as Record<string, unknown>).data : undefined;
  const entries = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};

  const successIds: string[] = [];
  const rejectedIds: string[] = [];
  const unresolvedIds: string[] = [];
  for (const id of batchIds) {
    const entry = entries[id];
    const status =
      entry && typeof entry === 'object' ? (entry as Record<string, unknown>).status : undefined;
    if (status === 'success') successIds.push(id);
    else if (status === 'rejected') rejectedIds.push(id);
    else unresolvedIds.push(id);
  }
  return { kind: 'processed', successIds, rejectedIds, unresolvedIds };
}

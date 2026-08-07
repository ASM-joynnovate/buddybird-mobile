// 외부로 나가는 문자열의 길이 상한 처리. 순수 함수 — I/O 없음.

// 코드포인트 기준으로 자른다. `slice` 는 UTF-16 코드 유닛 기준이라 상한이 이모지 한가운데
// 걸리면 서로게이트 페어를 쪼개 lone surrogate 를 남기고, 그 값은 UTF-8 로 U+FFFD 가 되어
// 받는 쪽에 깨진 값이 저장된다. 수집 서버 계약(SPEC-0002)의 상한도 코드포인트 기준이다.
export function truncateToCodePoints(value: string, maxLength: number): string {
  const codePoints = Array.from(value);
  return codePoints.length <= maxLength ? value : codePoints.slice(0, maxLength).join('');
}

/**
 * marketing semver 비교 유틸.
 *
 * buildNumber(`ios.buildNumber` / `android.versionCode`)는 EAS remote autoIncrement 가
 * 관리하므로 런타임에서 신뢰 가능한 비교 대상이 아니다. 따라서 `package.json` /
 * `app.config.ts` 의 marketing 버전(`MAJOR.MINOR.PATCH`)만 비교한다.
 *
 * 파싱 불가한 입력은 `null` 을 반환해, 호출자가 "판정 불가 → 팝업 미표시"(안전측)로
 * 처리하도록 한다.
 */

type SemverTuple = readonly [number, number, number];

function parseSemver(version: string): SemverTuple | null {
  const trimmed = version.trim();
  if (trimmed.length === 0) return null;

  // 선행 `v` 허용, pre-release/build 메타데이터(`-`, `+`)는 잘라내고 3-파트만 본다.
  const core = trimmed.replace(/^v/i, '').split(/[-+]/)[0];
  const parts = core.split('.');
  if (parts.length === 0 || parts.length > 3) return null;

  const numbers: number[] = [];
  for (let i = 0; i < 3; i += 1) {
    const raw = parts[i] ?? '0';
    if (!/^\d+$/.test(raw)) return null;
    numbers.push(Number.parseInt(raw, 10));
  }

  return [numbers[0], numbers[1], numbers[2]];
}

/**
 * `a` 와 `b` 를 비교한다. `a < b` 이면 음수, 같으면 0, `a > b` 이면 양수.
 * 어느 한쪽이라도 파싱 불가하면 `null`.
 */
export function compareSemver(a: string, b: string): number | null {
  const parsedA = parseSemver(a);
  const parsedB = parseSemver(b);
  if (!parsedA || !parsedB) return null;

  for (let i = 0; i < 3; i += 1) {
    if (parsedA[i] !== parsedB[i]) {
      return parsedA[i] - parsedB[i];
    }
  }
  return 0;
}

/** `current < target` 이면 true. 판정 불가(파싱 실패)면 false(안전측 — 팝업 미표시). */
export function isVersionBelow(current: string, target: string): boolean {
  const result = compareSemver(current, target);
  return result !== null && result < 0;
}

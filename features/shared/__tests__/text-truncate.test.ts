import { truncateToCodePoints } from '../text-truncate';

// 서로게이트 페어가 쪼개져 남은 반쪽. UTF-8 로 인코딩할 수 없어 받는 쪽에 U+FFFD 로 저장된다.
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

describe('truncateToCodePoints', () => {
  it('leaves a value within the limit intact', () => {
    expect(truncateToCodePoints('안녕 🦜', 50)).toBe('안녕 🦜');
  });

  it('leaves a value at exactly the limit intact', () => {
    expect(truncateToCodePoints('가'.repeat(50), 50)).toBe('가'.repeat(50));
  });

  it('cuts a value longer than the limit', () => {
    expect(truncateToCodePoints('가'.repeat(60), 50)).toBe('가'.repeat(50));
  });

  // `slice` 였다면 50번째 코드 유닛이 이모지 한가운데라 반쪽이 남는다.
  it('does not split an emoji that straddles the limit', () => {
    const sent = truncateToCodePoints(`${'가'.repeat(49)}🦜 하고 인사하기`, 50);

    expect(sent).not.toMatch(LONE_SURROGATE);
    expect(() => encodeURIComponent(sent)).not.toThrow();
    expect(sent).toBe(`${'가'.repeat(49)}🦜`);
  });

  it('counts the limit in code points, not utf-16 code units', () => {
    const sent = truncateToCodePoints('🦜'.repeat(60), 50);

    expect(Array.from(sent)).toHaveLength(50);
    expect(sent).toBe('🦜'.repeat(50));
  });

  it('leaves an empty value alone', () => {
    expect(truncateToCodePoints('', 20)).toBe('');
  });
});

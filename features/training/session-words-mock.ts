export const catColors: Record<string, string> = {
  인사: '#2A9D8F',
  음식: '#F4A261',
  이름: '#E76F51',
  기타: '#7C9885',
};

export const CATS = ['전체', '인사', '음식', '이름', '기타'] as const;

export type WordCategory = (typeof CATS)[number];

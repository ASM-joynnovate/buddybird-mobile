export const catColors: Record<string, string> = {
  인사: '#2A9D8F',
  음식: '#F4A261',
  이름: '#E76F51',
  기타: '#7C9885',
};

export const INITIAL_WORDS = [
  { id: 1, word: '안녕', cat: '인사' },
  { id: 2, word: '사과', cat: '음식' },
  { id: 3, word: '망고야', cat: '이름' },
  { id: 4, word: '잘 자', cat: '인사' },
  { id: 5, word: '엄마', cat: '이름' },
  { id: 6, word: '물', cat: '음식' },
  { id: 7, word: '빠빠이', cat: '인사' },
  { id: 8, word: '아빠', cat: '이름' },
];

export const CATS = ['전체', '인사', '음식', '이름', '기타'] as const;

export type WordCategory = (typeof CATS)[number];

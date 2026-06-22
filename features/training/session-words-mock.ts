export const CATS = ['전체', '인사', '음식', '이름', '기타'] as const;

export type WordCategory = (typeof CATS)[number];

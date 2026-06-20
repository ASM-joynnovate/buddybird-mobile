import { BuddyBirdColors } from '@/constants/theme';

export const catColors: Record<string, string> = {
  인사: BuddyBirdColors.primary,
  음식: BuddyBirdColors.secondary,
  이름: BuddyBirdColors.accentPurple,
  기타: BuddyBirdColors.primary,
};

export const catStrongColors: Record<string, string> = {
  인사: BuddyBirdColors.primaryDeep,
  음식: BuddyBirdColors.secondaryDeep,
  이름: BuddyBirdColors.accentPurpleDeep,
  기타: BuddyBirdColors.primaryDeep,
};

export const CATS = ['전체', '인사', '음식', '이름', '기타'] as const;

export type WordCategory = (typeof CATS)[number];

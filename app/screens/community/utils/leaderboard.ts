import type { Leaderboard } from '@/types/apis/leaderboard';

/** 1위의 학습 시간을 반환하는 함수 */
export const leaderboardTopScore = (leaderboard: Leaderboard) => {
	return leaderboard.items[0]?.score ?? leaderboard.me.score;
};

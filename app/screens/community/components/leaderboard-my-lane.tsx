import { useGetMe } from '@/hooks/apis/users';

import LeaderboardLane from '@/screens/community/components/leaderboard-lane';

interface Props {
	rank: number;
	score: number;
	topScore: number;
}

/**
 * 내 학습 시간 순위 막대 컴포넌트
 * @param rank 내 순위
 * @param score 내 이번 달 학습 시간 밀리초
 * @param topScore 1위의 학습 시간 밀리초
 */
const LeaderboardMyLane = ({ rank, score, topScore }: Props) => {
	const { data: meData } = useGetMe();

	return (
		<LeaderboardLane
			rank={rank}
			score={score}
			topScore={topScore}
			nickname={meData.nickname}
			photoUrl={meData.photo_file?.url ?? null}
			country={null}
			userIsMe
		/>
	);
};

export default LeaderboardMyLane;

import { useGetMe } from '@/hooks/apis/users';

import LeaderboardRankRow from '@/screens/community/components/leaderboard-rank-row';

interface Props {
	rank: number;
	score: number;
}

/**
 * 내 순위 컴포넌트
 * @param rank 내 순위
 * @param score 내 학습 시간 밀리초
 */
const LeaderboardMyRank = ({ rank, score }: Props) => {
	const { data: meData } = useGetMe();

	return (
		<LeaderboardRankRow
			rank={rank}
			score={score}
			nickname={meData.nickname}
			photoUrl={meData.photo_file?.url ?? null}
			country={null}
			isMe
		/>
	);
};

export default LeaderboardMyRank;

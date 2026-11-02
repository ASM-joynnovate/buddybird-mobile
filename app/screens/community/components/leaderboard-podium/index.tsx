import { StyleSheet, View } from 'react-native';

import type { LeaderboardItem } from '@/types/apis/leaderboard';

import LeaderboardPodiumStep from '@/screens/community/components/leaderboard-podium/step';
import { colors } from '@/theme';

const PODIUM_PLACES = [2, 1, 3] as const;

interface Props {
	rankEntries: LeaderboardItem[];
	myUserId: string;
}

/**
 * 순위 시상대 컴포넌트
 * @param rankEntries 1위부터의 순위 목록
 * @param myUserId 내 사용자 ID
 */
const LeaderboardPodium = ({ rankEntries, myUserId }: Props) => {
	const topScore = rankEntries[0]?.score ?? 0;

	return (
		<View>
			<View style={styles.stepContainer}>
				{PODIUM_PLACES.map((place) => {
					const rankEntry = rankEntries[place - 1];

					return (
						<LeaderboardPodiumStep
							key={place}
							place={place}
							rankEntry={rankEntry}
							topScore={topScore}
							isMe={rankEntry?.user.id === myUserId}
						/>
					);
				})}
			</View>
			<View style={styles.floor} />
		</View>
	);
};

const styles = StyleSheet.create({
	stepContainer: { flexDirection: 'row', alignItems: 'flex-end' },
	floor: { height: 2, marginHorizontal: -16, backgroundColor: colors.border },
});

export default LeaderboardPodium;

import { useState } from 'react';

import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { LeaderboardPeriod } from '@/types/apis/leaderboard';

import useIsLowPerformance from '@/hooks/use-is-low-performance';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import Animated, { FadeIn } from 'react-native-reanimated';

import LeaderboardMonthNav from '@/screens/community/components/leaderboard-month-nav';
import LeaderboardMonthPager from '@/screens/community/components/leaderboard-month-pager';
import LeaderboardRanking from '@/screens/community/components/leaderboard-ranking';
import { leaderboardMonthStart } from '@/screens/community/utils/leaderboard';
import { colors } from '@/theme';
import { localDate } from '@/utils/date';

import BuddyRefreshHint from '@/components/buddy-refresh/hint';
import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ToggleGroup } from '@/components/ui/toggle-group';

const PERIOD_FADE_MS = 200;

/** 학습 시간 전체 순위 화면 */
const LeaderboardScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation();

	const [period, setPeriod] = useState<LeaderboardPeriod>('all');
	const [monthStart, setMonthStart] = useState(leaderboardMonthStart);

	const lowPerformance = useIsLowPerformance();

	const handleMoveMonth = (step: number) => {
		setMonthStart((prev) => localDate(dayjs(prev).add(step, 'month')));
	};

	return (
		<Screen scrollable={false}>
			<BuddyRefreshHint mascotShown={!lowPerformance} />

			<View style={styles.headerContainer}>
				<ScreenHeader
					title={t('community.leaderboard.rankingTitle')}
					onBack={() => navigation.goBack()}
					trailing=<ToggleGroup
						options={[
							{ value: 'all', label: t('community.leaderboard.periods.all') },
							{ value: 'monthly', label: t('community.leaderboard.periods.monthly') },
						]}
						value={period}
						onChange={setPeriod}
					/>
				/>
			</View>

			{/*기간 변경 시 순위 영역 fade in*/}
			<Animated.View key={period} entering={FadeIn.duration(PERIOD_FADE_MS)} style={styles.periodContent}>
				{period === 'all' ? (
					<ErrorHandlingWrapper
						fallbackComponent={ScreenError}
						suspenseFallback=<ActivityIndicator color={colors.orange} style={styles.loading} />
					>
						<LeaderboardRanking period="all" start={null} />
					</ErrorHandlingWrapper>
				) : (
					<>
						<LeaderboardMonthNav start={monthStart} onMove={handleMoveMonth} />
						<LeaderboardMonthPager start={monthStart} onMove={handleMoveMonth} />
					</>
				)}
			</Animated.View>
		</Screen>
	);
};

const styles = StyleSheet.create({
	headerContainer: { paddingHorizontal: 12, paddingTop: 4 },
	periodContent: { flex: 1 },
	loading: { flex: 1 },
});

export default LeaderboardScreen;

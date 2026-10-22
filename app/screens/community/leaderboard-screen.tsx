import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { formatMonth } from '@/i18n/format';

import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';

import CountryScopeChips from '@/screens/community/components/country-scope-chips';
import LeaderboardRanking from '@/screens/community/components/leaderboard-ranking';
import { colors } from '@/theme';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';

/** 이번 달 학습 시간 전체 순위 화면 */
const LeaderboardScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation();

	return (
		<Screen scrollable={false}>
			<View style={styles.headerContainer}>
				<ScreenHeader
					title={t('community.leaderboard.title', { month: formatMonth(dayjs.utc()) })}
					onBack={() => navigation.goBack()}
				/>
			</View>

			<ErrorHandlingWrapper
				fallbackComponent={ScreenError}
				suspenseFallback=<ActivityIndicator color={colors.orange} style={styles.loading} />
			>
				<CountryScopeChips />

				<ErrorHandlingWrapper
					fallbackComponent={ScreenError}
					suspenseFallback=<ActivityIndicator color={colors.orange} style={styles.loading} />
				>
					<LeaderboardRanking />
				</ErrorHandlingWrapper>
			</ErrorHandlingWrapper>
		</Screen>
	);
};

const styles = StyleSheet.create({
	headerContainer: { paddingHorizontal: 12, paddingTop: 4 },
	loading: { flex: 1 },
});

export default LeaderboardScreen;

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { formatYearMonth } from '@/i18n/format';

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native';

import { leaderboardMonthStart } from '@/screens/community/utils/leaderboard';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { IconButton } from '@/components/ui/icon-button';

interface Props {
	start: string;
	onMove: (step: number) => void;
}

/**
 * 순위 달 이동 컴포넌트
 * @param start 표시할 달의 1일 날짜
 * @param onMove 달을 step만큼 이동하는 함수
 */
const LeaderboardMonthNav = ({ start, onMove }: Props) => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const isLatest = start >= leaderboardMonthStart();

	return (
		<View style={styles.navRow}>
			<Copy accessibilityRole="header" numberOfLines={1} style={styles.month}>
				{formatYearMonth(start, locale)}
			</Copy>
			<IconButton
				icon={ChevronLeftIcon}
				label={t('community.leaderboard.previousMonth')}
				onPress={() => onMove(-1)}
			/>
			<IconButton
				icon={ChevronRightIcon}
				label={t('community.leaderboard.nextMonth')}
				disabled={isLatest}
				onPress={() => onMove(1)}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	navRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 24, paddingRight: 12 },
	month: { flex: 1, minWidth: 0, fontFamily: font.extraBold, fontSize: 14.5 },
});

export default LeaderboardMonthNav;

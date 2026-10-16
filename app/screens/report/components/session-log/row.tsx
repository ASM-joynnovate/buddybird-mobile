import { memo } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { formatHour } from '@/i18n/format';

import { MoonIcon } from 'lucide-react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { HOUR } from '@/config/units';
import DashedLine from '@/screens/report/components/dashed-line';
import { sessionDetailColors } from '@/screens/report/components/session-detail-colors';
import SessionLogItem from '@/screens/report/components/session-log/item';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';
import type { LogItem, LogRow } from '@/utils/session-log';

import { Copy } from '@/components/ui/copy';

const SLEEP_COLORS = {
	light: '#fafafa',
	dark: '#ededed',
};

interface Props {
	row: LogRow;
	firstInDay: boolean;
	openItemId: string | null;
	sessionId: string;
	judgmentPending: boolean;
	wordName: string;
	onToggleItem: (item: LogItem) => void;
}

/**
 * 한 시간의 기록을 묶어 보이는 컴포넌트
 * @param row 행의 시각 범위 및 기록
 * @param firstInDay 그 날짜의 첫 행인지 여부
 * @param openItemId 이 행에서 펼친 기록 ID
 * @param sessionId 세션 ID
 * @param judgmentPending 세션을 분석하는 중인지 여부
 * @param wordName 세션에서 학습한 단어
 * @param onToggleItem 기록을 누르면 실행할 함수
 */
const SessionLogRow = memo(
	({ row, firstInDay, openItemId, sessionId, judgmentPending, wordName, onToggleItem }: Props) => {
		const { t } = useTranslation();

		const locale = useDeviceSettingsStore((state) => state.locale);

		if (row.items.length === 0 && !row.sleeping) {
			return (
				<View style={[styles.row, firstInDay && styles.firstRow, styles.quietRow]}>
					<Copy style={styles.quietHour}>{formatHour(row.start, locale)}</Copy>
					<View style={styles.quietLine}>
						<DashedLine color={colors.border} />
					</View>
				</View>
			);
		}

		return (
			<View style={[styles.row, firstInDay && styles.firstRow, row.sleeping && styles.sleepRow]}>
				{/*수면 구간의 빗금 바탕*/}
				{row.sleeping && (
					<View style={StyleSheet.absoluteFill}>
						<Svg width="100%" height="100%">
							<Defs>
								<Pattern
									id="sleep"
									width="16"
									height="16"
									patternUnits="userSpaceOnUse"
									patternTransform="rotate(45)"
								>
									<Rect width="8" height="16" fill={SLEEP_COLORS.light} />
									<Rect x="8" width="8" height="16" fill={SLEEP_COLORS.dark} />
								</Pattern>
							</Defs>
							<Rect width="100%" height="100%" fill="url(#sleep)" />
						</Svg>
					</View>
				)}

				<View style={styles.head}>
					{row.sleeping ? (
						<>
							<MoonIcon size={18} color={colors.muted} />
							<Copy style={[styles.hour, styles.sleepHours]}>
								{t('common.duration.hours', { value: Math.round((row.end - row.start) / HOUR) })}
							</Copy>
						</>
					) : (
						<Copy accessibilityRole="header" style={styles.hour}>
							{formatHour(row.start, locale)}
						</Copy>
					)}
				</View>

				{row.items.length > 0 && (
					<View style={[styles.items, row.sleeping && styles.sleepItems]}>
						{row.items.map((item, itemIndex) => (
							<SessionLogItem
								key={item.id}
								item={item}
								open={item.id === openItemId}
								dividerShown={
									itemIndex > 0 &&
									item.id !== openItemId &&
									row.items[itemIndex - 1].id !== openItemId
								}
								sleeping={row.sleeping}
								sessionId={sessionId}
								judgmentPending={judgmentPending}
								wordName={wordName}
								onToggle={onToggleItem}
							/>
						))}
					</View>
				)}
			</View>
		);
	},
);

const styles = StyleSheet.create({
	row: { marginTop: 24 },
	firstRow: { marginTop: 8 },
	quietRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	quietHour: { fontFamily: font.medium, fontSize: 14, lineHeight: 20, color: colors.subtle },
	quietLine: { flex: 1 },
	sleepRow: { marginHorizontal: -24, paddingVertical: 12, paddingHorizontal: 24 },
	head: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
	hour: { fontFamily: font.semiBold, fontSize: 16, lineHeight: 22, fontVariant: ['tabular-nums'] },
	sleepHours: { color: colors.muted },
	items: { overflow: 'hidden', borderRadius: 16, backgroundColor: sessionDetailColors.face },
	sleepItems: { backgroundColor: colors.background },
});

export default SessionLogRow;

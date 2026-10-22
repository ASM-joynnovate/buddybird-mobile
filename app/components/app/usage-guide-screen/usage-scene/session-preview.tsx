import type { ComponentType } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { Trans, useTranslation } from 'react-i18next';

import { formatDuration, formatHour, formatMonthDayLongWeekday, formatMonthDayTime } from '@/i18n/format';

import { CalendarIcon, ChevronLeftIcon } from 'lucide-react-native';
import type { SvgProps } from 'react-native-svg';

import { HOUR, MINUTE } from '@/config/units';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';
import { sessionDetailColors } from '@/theme/session-detail-colors';

import SessionPreviewItem, {
	type PreviewItem,
} from '@/components/app/usage-guide-screen/usage-scene/session-preview-item';
import DashedLine from '@/components/dashed-line';
import { Copy } from '@/components/ui/copy';

import MimicIcon from '@assets/images/icons/report/events/mimic.svg';
import AlertIcon from '@assets/images/icons/report/stats/alert.svg';
import ClockIcon from '@assets/images/icons/report/stats/clock.svg';
import SpeechBubbleIcon from '@assets/images/icons/report/stats/speech-bubble.svg';

const STAT_ICON_SIZE = 36;
/** 예시 학습의 시작 시각. 화요일이다 */
const EXAMPLE_STARTED_AT = '2025-10-21T08:52:00';
const EXAMPLE_LEARNING_MS = 3 * HOUR + 38 * MINUTE;
const EXAMPLE_MIMIC_COUNT = 7;
const EXAMPLE_EMERGENCY_COUNT = 1;

interface StatProps {
	icon: ComponentType<SvgProps>;
	value: string;
	label: string;
}

/**
 * 리포트 학습 상세의 요약 칸과 같은 모양의 칸 컴포넌트
 * @param icon 아이콘
 * @param value 값
 * @param label 이름
 */
const Stat = ({ icon: Icon, value, label }: StatProps) => {
	return (
		<View style={styles.stat}>
			<Icon width={STAT_ICON_SIZE} height={STAT_ICON_SIZE} />
			<View style={styles.statText}>
				<Copy numberOfLines={1} style={styles.statValue}>
					{value}
				</Copy>
				<Copy numberOfLines={1} style={styles.statLabel}>
					{label}
				</Copy>
			</View>
		</View>
	);
};

export interface PreviewHour {
	startedAt: string;
	items: PreviewItem[];
}

interface Props {
	overviewShown: boolean;
	hour: PreviewHour;
}

/**
 * 로그인 전에 보여 주는 리포트 학습 상세 예시 컴포넌트. 서버를 부르지 않고 예시 값만 그린다
 * @param overviewShown 요약 칸 4개를 보일지 여부
 * @param hour 기록에 보일 한 시간 묶음
 */
const SessionPreview = ({ overviewShown, hour }: Props) => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const words = t('onboarding.login.words', { returnObjects: true });
	const wordName = words[0];
	const openIds = hour.items.map((item) => item.sound !== undefined || item.photo !== undefined);

	return (
		<>
			<View style={styles.header}>
				<View style={styles.back}>
					<ChevronLeftIcon size={24} color={colors.text} />
				</View>

				<View style={styles.headText}>
					<Copy style={styles.title}>{t('report.detail.title')}</Copy>
					<Copy numberOfLines={1} style={styles.period}>
						<Trans
							i18nKey="report.detail.period"
							values={{
								start: formatMonthDayTime(EXAMPLE_STARTED_AT, locale),
								end: `<now>${t('report.detail.now')}</now>`,
							}}
							components={{ now: <Text style={styles.now} /> }}
						/>
					</Copy>
				</View>
			</View>

			{overviewShown && (
				<View style={styles.stats}>
					<Stat
						icon={ClockIcon}
						value={formatDuration(EXAMPLE_LEARNING_MS, locale)}
						label={t('report.detail.learningTime')}
					/>
					<Stat icon={SpeechBubbleIcon} value={wordName} label={t('report.detail.taughtWord')} />
					<Stat
						icon={MimicIcon}
						value={t('report.detail.mimicCountValue', { count: EXAMPLE_MIMIC_COUNT })}
						label={t('report.detail.mimicCount')}
					/>
					<Stat
						icon={AlertIcon}
						value={t('report.detail.emergencyCountValue', { count: EXAMPLE_EMERGENCY_COUNT })}
						label={t('report.detail.emergencyCount')}
					/>
				</View>
			)}

			<Copy style={[styles.logTitle, !overviewShown && styles.logTitleBelowHeader]}>
				{t('report.detail.sessionLog')}
			</Copy>

			<View style={styles.dayBreak}>
				<View style={styles.date}>
					<CalendarIcon size={14} color={colors.onFilled} />
					<Copy style={styles.dateText}>{formatMonthDayLongWeekday(EXAMPLE_STARTED_AT, locale)}</Copy>
				</View>
				<View style={styles.dayLine}>
					<DashedLine color={colors.border} />
				</View>
			</View>

			<Copy style={styles.hour}>{formatHour(hour.startedAt, locale)}</Copy>

			<View style={styles.items}>
				{hour.items.map((item, itemIndex) => (
					<SessionPreviewItem
						key={`${item.kind}-${item.startedAt}`}
						item={item}
						dividerShown={itemIndex > 0 && !openIds[itemIndex] && !openIds[itemIndex - 1]}
						wordName={wordName}
					/>
				))}
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: -12, paddingBottom: 4 },
	back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
	headText: { flex: 1, minWidth: 0 },
	title: { fontFamily: font.bold, fontSize: 20, lineHeight: 26 },
	period: {
		fontFamily: font.medium,
		fontSize: 13,
		lineHeight: 18,
		color: colors.muted,
		fontVariant: ['tabular-nums'],
	},
	now: { fontFamily: font.bold, color: colors.orangeDark },
	stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
	stat: {
		flexBasis: '40%',
		flexGrow: 1,
		minWidth: 0,
		minHeight: 72,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 12,
		paddingRight: 14,
		paddingLeft: 10,
		borderRadius: 16,
		backgroundColor: sessionDetailColors.face,
	},
	statText: { flex: 1, minWidth: 0 },
	statValue: { fontFamily: font.extraBold, fontSize: 18, lineHeight: 24, fontVariant: ['tabular-nums'] },
	statLabel: { fontFamily: font.medium, fontSize: 13, lineHeight: 18, color: colors.muted },
	logTitle: { marginTop: 32, marginBottom: 4, fontFamily: font.bold, fontSize: 18, lineHeight: 24 },
	logTitleBelowHeader: { marginTop: 14 },
	dayBreak: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, paddingVertical: 8 },
	date: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		height: 30,
		paddingRight: 12,
		paddingLeft: 10,
		borderRadius: 10,
		backgroundColor: colors.text,
	},
	dateText: { fontFamily: font.medium, fontSize: 13, color: colors.onFilled },
	dayLine: { flex: 1 },
	hour: {
		marginTop: 8,
		marginBottom: 8,
		fontFamily: font.semiBold,
		fontSize: 16,
		lineHeight: 22,
		fontVariant: ['tabular-nums'],
	},
	items: { overflow: 'hidden', borderRadius: 16, backgroundColor: sessionDetailColors.face },
});

export default SessionPreview;

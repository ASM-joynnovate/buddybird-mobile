import { type ComponentType, memo } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { formatDuration } from '@/i18n/format';

import type { SvgProps } from 'react-native-svg';

import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';
import { sessionDetailColors } from '@/theme/session-detail-colors';
import { joinLabel } from '@/utils/a11y';

import { Copy } from '@/components/ui/copy';

import MimicIcon from '@assets/images/icons/report/events/mimic.svg';
import AlertIcon from '@assets/images/icons/report/stats/alert.svg';
import ClockIcon from '@assets/images/icons/report/stats/clock.svg';
import SpeechBubbleIcon from '@assets/images/icons/report/stats/speech-bubble.svg';

const ICON_SIZE = 36;

interface StatProps {
	icon: ComponentType<SvgProps>;
	value: string;
	label: string;
}

/**
 * 요약 칸 컴포넌트
 * @param icon 아이콘
 * @param value 값
 * @param label 이름
 */
const Stat = ({ icon: Icon, value, label }: StatProps) => {
	return (
		<View accessible accessibilityLabel={joinLabel(label, value)} style={styles.stat}>
			<Icon width={ICON_SIZE} height={ICON_SIZE} />
			<View style={styles.statText}>
				<Copy numberOfLines={1} style={styles.value}>
					{value}
				</Copy>
				<Copy numberOfLines={1} style={styles.label}>
					{label}
				</Copy>
			</View>
		</View>
	);
};

interface Props {
	learningMs: number;
	wordName: string;
	mimicCount: number;
	emergencyCount: number;
}

/**
 * 이번 학습 요약 컴포넌트
 * @param learningMs 학습 시간
 * @param wordName 가르친 단어
 * @param mimicCount 따라 한 횟수
 * @param emergencyCount 응급 상황 수
 */
const SessionOverview = memo(({ learningMs, wordName, mimicCount, emergencyCount }: Props) => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	return (
		<View style={styles.stats}>
			<Stat icon={ClockIcon} value={formatDuration(learningMs, locale)} label={t('report.detail.learningTime')} />
			<Stat icon={SpeechBubbleIcon} value={wordName} label={t('report.detail.taughtWord')} />
			<Stat
				icon={MimicIcon}
				value={t('report.detail.mimicCountValue', { count: mimicCount })}
				label={t('report.detail.mimicCount')}
			/>
			<Stat
				icon={AlertIcon}
				value={t('report.detail.emergencyCountValue', { count: emergencyCount })}
				label={t('report.detail.emergencyCount')}
			/>
		</View>
	);
});

const styles = StyleSheet.create({
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
	value: { fontFamily: font.extraBold, fontSize: 18, lineHeight: 24, fontVariant: ['tabular-nums'] },
	label: { fontFamily: font.medium, fontSize: 13, lineHeight: 18, color: colors.muted },
});

export default SessionOverview;

import { Image, StyleSheet, View } from 'react-native';

import type { UsageStep } from '@/types/usage-guide';

import { useTranslation } from 'react-i18next';

import { formatHour, formatMonthDayLongWeekday, formatMonthDayTime } from '@/i18n/format';

import { CalendarIcon, ChevronLeftIcon, PlayIcon } from 'lucide-react-native';

import { HOUR, MINUTE } from '@/config/units';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font, radius } from '@/theme';
import { sessionDetailColors } from '@/theme/session-detail-colors';

import UsageSceneSessionPreviewItem from '@/components/app/usage-guide-screen/usage-scene/session-preview/item';
import DashedLine from '@/components/dashed-line';
import SessionLogSoundTrack from '@/components/session/log-sound-track';
import SessionOverview from '@/components/session/overview';
import { Copy } from '@/components/ui/copy';

const appearedPhoto: number = require('@assets/images/onboarding/usage-appeared.jpg');

interface Props {
	step: UsageStep;
}

/**
 * 리포트 학습 상세 예시 컴포넌트
 * @param step 현재 안내 단계
 */
const UsageSceneSessionPreview = ({ step }: Props) => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const wordName = t('onboarding.login.words', { returnObjects: true })[0];
	const parrotName = t('report.detail.kinds.parrot');
	const mimicScore = t('report.detail.percent', { value: 92 });

	return (
		<>
			<View style={styles.header}>
				<View style={styles.back}>
					<ChevronLeftIcon size={24} color={colors.text} />
				</View>

				<View style={styles.headText}>
					<Copy style={styles.title}>{t('report.detail.title')}</Copy>
					<Copy numberOfLines={1} style={styles.period}>
						{t('report.detail.period', {
							start: formatMonthDayTime('2025-10-21T08:52:00', locale),
							end: t('report.detail.now'),
						})}
					</Copy>
				</View>
			</View>

			{step === 'live' && (
				<SessionOverview
					learningMs={3 * HOUR + 38 * MINUTE}
					wordName={wordName}
					mimicCount={7}
					emergencyCount={1}
				/>
			)}

			<Copy style={[styles.logTitle, step !== 'live' && styles.logTitleBelowHeader]}>
				{t('report.detail.sessionLog')}
			</Copy>

			<View style={styles.dayBreak}>
				<View style={styles.date}>
					<CalendarIcon size={14} color={colors.onFilled} />
					<Copy style={styles.dateText}>{formatMonthDayLongWeekday('2025-10-21T08:52:00', locale)}</Copy>
				</View>
				<View style={styles.dayLine}>
					<DashedLine color={colors.border} />
				</View>
			</View>

			<Copy style={styles.hour}>{formatHour('2025-10-21T15:00:00', locale)}</Copy>

			<View style={styles.items}>
				{step === 'live' && (
					<>
						<UsageSceneSessionPreviewItem kind="parrot" name={parrotName} time="15:31:04" />
						<UsageSceneSessionPreviewItem
							kind="mimic"
							name={wordName}
							value={mimicScore}
							time="15:36:12"
							dividerShown
						/>
					</>
				)}

				{step === 'sound' && (
					<>
						<UsageSceneSessionPreviewItem kind="parrot" name={parrotName} time="15:31:04" />
						<UsageSceneSessionPreviewItem kind="mimic" name={wordName} value={mimicScore} time="15:36:12">
							<View style={styles.player}>
								<SessionLogSoundTrack
									accent={colors.orange}
									progress={0.38}
									durationText={t('common.duration.seconds', { value: '3.0' })}
								/>
								<View style={styles.play}>
									<PlayIcon size={13} color={colors.onFilled} fill={colors.onFilled} />
								</View>
							</View>
						</UsageSceneSessionPreviewItem>
						<UsageSceneSessionPreviewItem
							kind="distressCall"
							name={t('report.detail.kinds.distressCall')}
							value={t('common.duration.seconds', { value: 12 })}
							time={t('report.detail.timeRange', { start: '15:42:10', end: '15:42:22' })}
						/>
					</>
				)}

				{step === 'motion' && (
					<>
						<UsageSceneSessionPreviewItem
							kind="parrotDisappeared"
							name={t('report.detail.kinds.parrotDisappeared')}
							time={t('report.detail.timeRange', { start: '15:45:40', end: '15:51:02' })}
						/>
						<UsageSceneSessionPreviewItem
							kind="parrotAppeared"
							name={t('report.detail.kinds.parrotAppeared')}
							time="15:51:02"
						>
							<View style={styles.media}>
								<Image
									accessibilityIgnoresInvertColors
									source={appearedPhoto}
									style={styles.mediaImage}
								/>
							</View>
						</UsageSceneSessionPreviewItem>
					</>
				)}
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
	player: { flexDirection: 'row', alignItems: 'center', gap: 24 },
	play: {
		width: 36,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: radius.pill,
		backgroundColor: colors.orange,
	},
	media: { width: '100%', aspectRatio: 16 / 9, marginTop: 10, overflow: 'hidden', borderRadius: 14 },
	mediaImage: { width: '100%', height: '100%' },
});

export default UsageSceneSessionPreview;

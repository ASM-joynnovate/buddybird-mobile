import { StyleSheet, View } from 'react-native';

import type { ReportGuideSound, ReportGuideTargetRegister } from '@/types/guide/report';

import { useTranslation } from 'react-i18next';

import { formatMonthDayTime } from '@/i18n/format';

import Animated, { type AnimatedRef, type SharedValue, useScrollOffset } from 'react-native-reanimated';

import { MINUTE } from '@/config/units';
import ReportGuideLogItem from '@/screens/report/components/report-guide/log-item';
import ReportGuideTarget from '@/screens/report/components/report-guide/target';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, contentMaxWidth, font } from '@/theme';

import GuideSceneSessionPreviewDayBreak from '@/components/guide-scene/session-preview/day-break';
import GuideSceneSessionPreviewHeader from '@/components/guide-scene/session-preview/header';
import GuideSceneSessionPreviewItemList from '@/components/guide-scene/session-preview/item-list';
import SessionLogItemHead from '@/components/session/session-log-item-head';
import SessionOverview from '@/components/session/session-overview';
import { Copy } from '@/components/ui/copy';

interface Props {
	scrollRef: AnimatedRef<Animated.ScrollView>;
	scrollY: SharedValue<number>;
	wordName: string;
	sound: ReportGuideSound;
	logItemOpen: boolean;
	onRegisterTarget: ReportGuideTargetRegister;
	onOpenLogItem: () => void;
	onPlayEnd: () => void;
	onReview: () => void;
}

/**
 * 예시 데이터로 그린 학습 상세 화면 컴포넌트
 * @param scrollRef 화면 스크롤
 * @param scrollY 화면 스크롤 위치
 * @param wordName 예시 단어
 * @param sound 예시 소리 파일 및 길이
 * @param logItemOpen 기록을 펼쳤는지 여부
 * @param onRegisterTarget 강조 영역 등록 함수
 * @param onOpenLogItem 기록을 누르면 실행할 함수
 * @param onPlayEnd 재생이 끝나면 실행할 함수
 * @param onReview 틀렸어요 또는 맞았어요를 누르면 실행할 함수
 */
const ReportGuideSessionDetail = ({
	scrollRef,
	scrollY,
	wordName,
	sound,
	logItemOpen,
	onRegisterTarget,
	onOpenLogItem,
	onPlayEnd,
	onReview,
}: Props) => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	useScrollOffset(scrollRef, scrollY);

	return (
		<Animated.ScrollView
			ref={scrollRef}
			scrollEnabled={false}
			showsVerticalScrollIndicator={false}
			contentContainerStyle={styles.content}
		>
			<GuideSceneSessionPreviewHeader
				period={t('report.detail.period', {
					start: formatMonthDayTime('2025-10-31T15:22:00', locale),
					end: formatMonthDayTime('2025-10-31T15:35:00', locale),
				})}
			/>

			<SessionOverview learningMs={13 * MINUTE} wordName={wordName} mimicCount={2} emergencyCount={2} />

			<Copy style={styles.logTitle}>{t('report.detail.sessionLog')}</Copy>
			<View style={styles.divider} />

			<GuideSceneSessionPreviewDayBreak date="2025-10-31T15:22:00" />

			<ReportGuideTarget step="logKinds" onRegister={onRegisterTarget}>
				<GuideSceneSessionPreviewItemList hour="2025-10-31T15:00:00">
					<View style={styles.item}>
						<SessionLogItemHead
							kind="mimic"
							name={wordName}
							value={t('report.detail.percent', { value: 90 })}
							time="15:22:45"
							open={false}
							dividerShown={false}
						/>
					</View>
					<View style={styles.item}>
						<SessionLogItemHead
							kind="distressCall"
							name={t('report.detail.kinds.distressCall')}
							value={t('common.duration.seconds', { value: 19 })}
							time={t('report.detail.timeRange', { start: '15:22:45', end: '15:23:04' })}
							open={false}
							dividerShown
						/>
					</View>
					<View style={styles.item}>
						<SessionLogItemHead
							kind="parrot"
							name={t('report.detail.kinds.parrot')}
							time="15:24:10"
							open={false}
							dividerShown
						/>
					</View>
					<View style={styles.item}>
						<SessionLogItemHead
							kind="parrotDisappeared"
							name={t('report.detail.kinds.parrotDisappeared')}
							time={t('report.detail.timeRange', { start: '15:28:20', end: '15:31:40' })}
							open={false}
							dividerShown
						/>
					</View>
					<View style={styles.item}>
						<SessionLogItemHead
							kind="parrotAppeared"
							name={t('report.detail.kinds.parrotAppeared')}
							time="15:31:40"
							open={false}
							dividerShown
						/>
					</View>
					<ReportGuideTarget step="logItem" onRegister={onRegisterTarget}>
						<ReportGuideLogItem
							wordName={wordName}
							sound={sound}
							open={logItemOpen}
							onRegisterTarget={onRegisterTarget}
							onOpen={onOpenLogItem}
							onPlayEnd={onPlayEnd}
							onReview={onReview}
						/>
					</ReportGuideTarget>
				</GuideSceneSessionPreviewItemList>
			</ReportGuideTarget>
		</Animated.ScrollView>
	);
};

const styles = StyleSheet.create({
	content: {
		flexGrow: 1,
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
		paddingHorizontal: 24,
		paddingTop: 20,
		paddingBottom: 32,
	},
	logTitle: { marginTop: 32, marginBottom: 16, fontFamily: font.bold, fontSize: 18, lineHeight: 24 },
	divider: { height: 2, marginHorizontal: -24, backgroundColor: colors.border },
	item: { paddingHorizontal: 14 },
});

export default ReportGuideSessionDetail;

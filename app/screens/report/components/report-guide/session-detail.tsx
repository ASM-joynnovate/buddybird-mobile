import { StyleSheet, useWindowDimensions, View } from 'react-native';

import type { ReportGuideSound, ReportGuideTargetRegister } from '@/types/guide/report';

import { useTranslation } from 'react-i18next';

import { formatMonthDayTime } from '@/i18n/format';

import Animated, { type AnimatedRef, type SharedValue, useScrollOffset } from 'react-native-reanimated';

import { HOUR } from '@/config/units';
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
	const { height } = useWindowDimensions();

	const locale = useDeviceSettingsStore((state) => state.locale);

	useScrollOffset(scrollRef, scrollY);

	return (
		<Animated.ScrollView
			ref={scrollRef}
			scrollEnabled={false}
			showsVerticalScrollIndicator={false}
			contentContainerStyle={[
				styles.content,
				// 마지막 강조 영역도 위로 올릴 여백
				{ paddingBottom: height },
			]}
		>
			<GuideSceneSessionPreviewHeader
				period={t('report.detail.period', {
					start: formatMonthDayTime('2025-10-31T22:00:00', locale),
					end: formatMonthDayTime('2025-11-01T06:00:00', locale),
				})}
			/>

			<SessionOverview learningMs={8 * HOUR} wordName={wordName} mimicCount={1} emergencyCount={3} />

			<Copy style={styles.logTitle}>{t('report.detail.sessionLog')}</Copy>
			<View style={styles.divider} />

			<GuideSceneSessionPreviewDayBreak date="2025-10-31T22:00:00" />

			<ReportGuideTarget step="soundKinds" onRegister={onRegisterTarget}>
				<GuideSceneSessionPreviewItemList hour="2025-10-31T22:00:00">
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
					<View style={styles.item}>
						<SessionLogItemHead
							kind="distressCall"
							name={t('report.detail.kinds.distressCall')}
							value={t('common.duration.seconds', { value: 19 })}
							time={t('report.detail.timeRange', { start: '22:40:12', end: '22:40:31' })}
							open={false}
							dividerShown
						/>
					</View>
					<View style={styles.item}>
						<SessionLogItemHead
							kind="parrot"
							name={t('report.detail.kinds.parrot')}
							time="22:52:48"
							open={false}
							dividerShown
						/>
					</View>
				</GuideSceneSessionPreviewItemList>
			</ReportGuideTarget>

			<GuideSceneSessionPreviewDayBreak date="2025-11-01T03:00:00" />

			<ReportGuideTarget step="petcamKinds" onRegister={onRegisterTarget}>
				<GuideSceneSessionPreviewItemList hour="2025-11-01T03:00:00">
					<View style={styles.item}>
						<SessionLogItemHead
							kind="parrotDisappeared"
							name={t('report.detail.kinds.parrotDisappeared')}
							time={t('report.detail.timeRange', { start: '03:12:20', end: '03:16:40' })}
							open={false}
							dividerShown={false}
						/>
					</View>
					<View style={styles.item}>
						<SessionLogItemHead
							kind="parrotAppeared"
							name={t('report.detail.kinds.parrotAppeared')}
							time="03:16:40"
							open={false}
							dividerShown
						/>
					</View>
					<View style={styles.item}>
						<SessionLogItemHead
							kind="parrotMotionless"
							name={t('report.detail.kinds.parrotMotionless')}
							time={t('report.detail.timeRange', { start: '03:40:05', end: '04:25:10' })}
							open={false}
							dividerShown
						/>
					</View>
					<View style={styles.item}>
						<SessionLogItemHead
							kind="parrotMoved"
							name={t('report.detail.kinds.parrotMoved')}
							time="04:25:10"
							open={false}
							dividerShown
						/>
					</View>
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
	},
	logTitle: { marginTop: 32, marginBottom: 16, fontFamily: font.bold, fontSize: 18, lineHeight: 24 },
	divider: { height: 2, marginHorizontal: -24, backgroundColor: colors.border },
	item: { paddingHorizontal: 14 },
});

export default ReportGuideSessionDetail;

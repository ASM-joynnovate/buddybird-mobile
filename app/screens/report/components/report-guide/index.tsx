import { type ReactNode, useCallback, useEffect, useState } from 'react';

import { type LayoutRectangle, StyleSheet, View } from 'react-native';

import {
	type ReportGuideSample,
	type ReportGuideSound,
	type ReportGuideStep,
	type ReportGuideTargetRegister,
	reportGuideSteps,
} from '@/types/guide/report';
import { localeDefinitions } from '@/types/locale';

import { useTranslation } from 'react-i18next';

import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
	type AnimatedRef,
	measure,
	type MeasuredDimensions,
	scrollTo,
	SlideInRight,
	useAnimatedReaction,
	useAnimatedRef,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import ReportGuideCoachMark from '@/screens/report/components/report-guide/coach-mark';
import ReportGuidePetcamKinds from '@/screens/report/components/report-guide/petcam-kinds';
import ReportGuideSessionDetail from '@/screens/report/components/report-guide/session-detail';
import ReportGuideSign from '@/screens/report/components/report-guide/sign';
import ReportGuideSignMessage from '@/screens/report/components/report-guide/sign-message';
import ReportGuideSoundKinds from '@/screens/report/components/report-guide/sound-kinds';
import ReportGuideSummary from '@/screens/report/components/report-guide/summary';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, radius } from '@/theme';

const PUSH_MS = 350;
const SCROLL_MS = 400;
const REVIEW_HOLD_MS = 700;
const REVEAL_MARGIN = 24;

const guideSamples: Record<ReportGuideSample, { word: string; sound: ReportGuideSound }> = {
	annyeong: { word: '안녕', sound: { file: require('@assets/audio/report-guide/annyeong.wav'), durationMs: 584 } },
	hello: { word: 'Hello', sound: { file: require('@assets/audio/report-guide/hello.wav'), durationMs: 510 } },
};

const stepDefinitions: Record<
	ReportGuideStep,
	{ page: 'summary' | 'sessionDetail'; radius: number; tappable: boolean }
> = {
	session: { page: 'summary', radius: radius.card, tappable: true },
	soundKinds: { page: 'sessionDetail', radius: radius.control, tappable: false },
	petcamKinds: { page: 'sessionDetail', radius: radius.control, tappable: false },
	logItem: { page: 'sessionDetail', radius: radius.control, tappable: true },
	play: { page: 'sessionDetail', radius: radius.pill, tappable: true },
	review: { page: 'sessionDetail', radius: radius.control, tappable: true },
	share: { page: 'sessionDetail', radius: radius.control, tappable: false },
};

/** 측정 값을 강조 영역으로 변환하는 함수 */
const toTarget = (targetLayout: MeasuredDimensions, rootLayout: MeasuredDimensions): LayoutRectangle => {
	'worklet';

	return {
		x: targetLayout.pageX - rootLayout.pageX,
		y: targetLayout.pageY - rootLayout.pageY,
		width: targetLayout.width,
		height: targetLayout.height,
	};
};

interface Props {
	onClose: () => void;
}

/**
 * 리포트 사용 방법 Coach Mark 컴포넌트
 * @param onClose 안내를 끝내거나 건너뛸 때 실행할 함수
 */
const ReportGuide = ({ onClose }: Props) => {
	const { t } = useTranslation();
	const tabBarHeight = useBottomTabBarHeight();
	const insets = useSafeAreaInsets();

	const [stepIndex, setStepIndex] = useState(0);
	const [measuredTarget, setMeasuredTarget] = useState<{ step: ReportGuideStep; layout: LayoutRectangle } | null>(
		null,
	);
	const [targetRefs, setTargetRefs] = useState<Partial<Record<ReportGuideStep, AnimatedRef<Animated.View>>>>({});
	const [sessionDetailShown, setSessionDetailShown] = useState(false);
	const [logItemOpen, setLogItemOpen] = useState(false);
	const [reviewSelected, setReviewSelected] = useState(false);

	const summaryScrollRef = useAnimatedRef<Animated.ScrollView>();
	const sessionDetailScrollRef = useAnimatedRef<Animated.ScrollView>();
	const rootRef = useAnimatedRef<Animated.View>();

	const summaryScrollY = useSharedValue(0);
	const sessionDetailScrollY = useSharedValue(0);
	const revealScrollY = useSharedValue<number | null>(null);

	const locale = useDeviceSettingsStore((state) => state.locale);

	const step = reportGuideSteps[stepIndex];
	const stepDefinition = stepDefinitions[step];
	const lastStepShown = stepIndex === reportGuideSteps.length - 1;
	const summaryShown = stepDefinition.page === 'summary';
	const guideSample = guideSamples[localeDefinitions[locale].reportGuideSample];
	// 이전 단계에서 측정한 강조 영역은 표시하지 않음
	const target = measuredTarget?.step === step ? measuredTarget.layout : null;
	const targetRef = targetRefs[step];
	const signMessages: Record<ReportGuideStep, ReactNode> = {
		session: <ReportGuideSignMessage title={t('report.guide.session')} />,
		soundKinds: <ReportGuideSoundKinds />,
		petcamKinds: <ReportGuidePetcamKinds />,
		logItem: <ReportGuideSignMessage title={t('report.guide.logItem')} />,
		play: <ReportGuideSignMessage title={t('report.guide.play')} />,
		review: <ReportGuideSignMessage title={t('report.guide.review')} />,
		share: <ReportGuideSignMessage title={t('report.guide.share.title')} detail={t('report.guide.share.detail')} />,
	};

	/** 단계 완료 후 다음 단계로 이동하는 함수 */
	const completeStep = useCallback((completedStep: ReportGuideStep) => {
		setStepIndex((prev) => (reportGuideSteps[prev] === completedStep ? prev + 1 : prev));
	}, []);

	/** 재생이 끝난 단계 완료 함수 */
	const completePlayStep = useCallback(() => completeStep('play'), [completeStep]);

	/** 레이아웃이 계산된 강조 영역 등록 함수 */
	const registerTarget = useCallback<ReportGuideTargetRegister>((targetStep, laidOutRef) => {
		setTargetRefs((prev) => (prev[targetStep] === laidOutRef ? prev : { ...prev, [targetStep]: laidOutRef }));
	}, []);

	/** 강조 영역 표시를 위한 스크롤 위치 변경 */
	useAnimatedReaction(
		() => revealScrollY.get(),
		(scrollY) => {
			if (scrollY !== null) {
				scrollTo(summaryShown ? summaryScrollRef : sessionDetailScrollRef, 0, scrollY, false);
			}
		},
	);

	/** 단계 변경 시 강조 영역 스크롤 및 측정 */
	useEffect(() => {
		if (!targetRef) {
			return;
		}

		const scrollRef = summaryShown ? summaryScrollRef : sessionDetailScrollRef;
		const scrollY = summaryShown ? summaryScrollY : sessionDetailScrollY;

		scheduleOnUI(() => {
			'worklet';

			const rootLayout = measure(rootRef);
			const targetLayout = measure(targetRef);
			const scrollLayout = measure(scrollRef);

			if (!rootLayout || !targetLayout || !scrollLayout) {
				return;
			}

			const targetBottomOverflow =
				targetLayout.pageY + targetLayout.height + REVEAL_MARGIN - (scrollLayout.pageY + scrollLayout.height);
			const targetTopOffset = targetLayout.pageY - scrollLayout.pageY - REVEAL_MARGIN;
			// 강조 영역 위쪽이 보이는 위치로 스크롤
			const revealScrollDistance = Math.min(Math.max(targetBottomOverflow, 0), targetTopOffset);

			if (revealScrollDistance === 0) {
				scheduleOnRN(setMeasuredTarget, { step, layout: toTarget(targetLayout, rootLayout) });

				return;
			}

			revealScrollY.set(scrollY.get());
			revealScrollY.set(
				withTiming(scrollY.get() + revealScrollDistance, { duration: SCROLL_MS }, (finished) => {
					const revealedLayout = measure(targetRef);

					revealScrollY.set(null);

					if (finished && revealedLayout) {
						scheduleOnRN(setMeasuredTarget, { step, layout: toTarget(revealedLayout, rootLayout) });
					}
				}),
			);
		});
	}, [
		revealScrollY,
		rootRef,
		sessionDetailScrollRef,
		sessionDetailScrollY,
		step,
		summaryScrollRef,
		summaryScrollY,
		summaryShown,
		targetRef,
	]);

	/** 선택한 리뷰 버튼 표시 후 다음 단계로 이동 */
	useEffect(() => {
		if (!reviewSelected) {
			return;
		}

		const timer = setTimeout(() => completeStep('review'), REVIEW_HOLD_MS);

		return () => clearTimeout(timer);
	}, [completeStep, reviewSelected]);

	const handleOpenSession = () => {
		setMeasuredTarget(null);
		setSessionDetailShown(true);
	};

	const handleOpenLogItem = () => {
		setLogItemOpen(true);
		completeStep('logItem');
	};

	// 단계의 동작을 실행하고 다음 단계로 이동
	const handleNext = () => {
		if (step === 'session') {
			handleOpenSession();
		} else if (step === 'logItem') {
			handleOpenLogItem();
		} else {
			completeStep(step);
		}
	};

	return (
		<GestureHandlerRootView style={styles.container}>
			<Animated.View ref={rootRef} collapsable={false} style={styles.container}>
				<View
					accessibilityElementsHidden
					importantForAccessibility="no-hide-descendants"
					style={[styles.pages, { bottom: tabBarHeight }]}
				>
					{/*SafeAreaView 대신 여백 직접 지정*/}
					<View
						style={[
							styles.page,
							{ paddingTop: insets.top, paddingRight: insets.right, paddingLeft: insets.left },
						]}
					>
						<View style={styles.pageArea}>
							<ReportGuideSummary
								scrollRef={summaryScrollRef}
								scrollY={summaryScrollY}
								wordName={guideSample.word}
								onRegisterTarget={registerTarget}
								onOpenSession={handleOpenSession}
							/>

							{sessionDetailShown && (
								<Animated.View
									entering={SlideInRight.duration(PUSH_MS).withCallback((finished) => {
										'worklet';

										if (finished) {
											scheduleOnRN(completeStep, 'session');
										}
									})}
									style={styles.sessionDetail}
								>
									<ReportGuideSessionDetail
										scrollRef={sessionDetailScrollRef}
										scrollY={sessionDetailScrollY}
										wordName={guideSample.word}
										sound={guideSample.sound}
										logItemOpen={logItemOpen}
										onRegisterTarget={registerTarget}
										onOpenLogItem={handleOpenLogItem}
										onPlayEnd={completePlayStep}
										onReview={() => setReviewSelected(true)}
									/>
								</Animated.View>
							)}
						</View>
					</View>
				</View>

				<ReportGuideCoachMark
					target={target}
					targetRadius={stepDefinition.radius}
					targetTappable={stepDefinition.tappable}
					onSkip={onClose}
				>
					<ReportGuideSign
						key={step}
						action={{
							label: t(lastStepShown ? 'common.done' : 'common.next'),
							onPress: lastStepShown ? onClose : handleNext,
						}}
					>
						{signMessages[step]}
					</ReportGuideSign>
				</ReportGuideCoachMark>
			</Animated.View>
		</GestureHandlerRootView>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1 },
	pages: { position: 'absolute', top: 0, right: 0, left: 0 },
	page: { flex: 1, backgroundColor: colors.background },
	pageArea: { flex: 1 },
	sessionDetail: {
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		backgroundColor: colors.background,
	},
});

export default ReportGuide;

import type Animated from 'react-native-reanimated';
import type { AnimatedRef } from 'react-native-reanimated';

export const reportGuideSteps = [
	'chart',
	'wordBars',
	'session',
	'logKinds',
	'logItem',
	'play',
	'review',
	'share',
] as const;

export type ReportGuideStep = (typeof reportGuideSteps)[number];
export type ReportGuideGesture = 'tap' | 'scrub';
export type ReportGuideSample = 'annyeong' | 'hello';
export interface ReportGuideSound {
	file: number;
	durationMs: number;
}

export type ReportGuideTargetRegister = (step: ReportGuideStep, targetRef: AnimatedRef<Animated.View>) => void;

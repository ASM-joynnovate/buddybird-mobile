import { type ComponentType, type ReactElement, useEffect, useState } from 'react';

import { type LayoutChangeEvent, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import type { PullEdge, PullStatus, PullToRefreshIndicatorProps } from '@/types/pull-to-refresh';

import type { PullToRefreshState } from '@/hooks/use-pull-to-refresh';

import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

interface IndicatorState {
	status: PullStatus;
	edge: PullEdge;
}

interface Props {
	pullToRefresh: PullToRefreshState;
	indicatorComponents: ComponentType<PullToRefreshIndicatorProps>[];
	children: ReactElement;
	style?: StyleProp<ViewStyle>;
	indicatorStyle?: StyleProp<ViewStyle>;
}

/**
 * 당겨서 새로고침 목록 컴포넌트
 * @param pullToRefresh 당기기 상태
 * @param indicatorComponents 당길 때마다 무작위로 선택할 새로고침 표시 컴포넌트
 * @param children usePullToRefresh의 scrollProps를 받은 목록
 * @param style 목록 영역의 스타일
 * @param indicatorStyle 새로고침 표시 영역의 스타일
 */
const PullToRefreshContainer = ({ pullToRefresh, indicatorComponents, children, style, indicatorStyle }: Props) => {
	const { status, distance, distanceEdge } = pullToRefresh;

	const [indicatorState, setIndicatorState] = useState<IndicatorState>({ status: 'idle', edge: 'top' });
	const [indicatorIndex, setIndicatorIndex] = useState(0);

	const containerHeight = useSharedValue(0);

	const Indicator = indicatorComponents[indicatorIndex % indicatorComponents.length];

	// 아래 끝에서는 목록 아래에 표시
	const indicatorOffsetStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: distanceEdge.get() === 'top' ? 0 : containerHeight.get() - distance.get() }],
	}));

	/** 당기기 상태가 변경되면 표시 컴포넌트만 렌더링 */
	useAnimatedReaction(
		() => status.get(),
		(nextStatus, previousStatus) => {
			if (previousStatus === null || nextStatus === previousStatus) {
				return;
			}

			scheduleOnRN(setIndicatorState, { status: nextStatus, edge: distanceEdge.get() });
		},
	);

	/** 당기기가 끝나면 다음 표시 컴포넌트 무작위 선택 */
	useEffect(() => {
		if (indicatorState.status === 'idle') {
			setIndicatorIndex(Math.floor(Math.random() * indicatorComponents.length));
		}
	}, [indicatorComponents.length, indicatorState.status]);

	const handleLayout = (event: LayoutChangeEvent) => {
		containerHeight.set(event.nativeEvent.layout.height);
	};

	// 당기는 동안에만 목록 뒤에 표시
	return (
		<View style={[styles.container, style]} onLayout={handleLayout}>
			{indicatorState.status !== 'idle' && (
				<View pointerEvents="none" style={[styles.indicatorArea, indicatorStyle]}>
					<Animated.View style={[styles.indicator, indicatorOffsetStyle]}>
						<Indicator edge={indicatorState.edge} status={indicatorState.status} distance={distance} />
					</Animated.View>
				</View>
			)}

			<GestureDetector gesture={pullToRefresh.gesture}>{children}</GestureDetector>
		</View>
	);
};

const styles = StyleSheet.create({
	// 이동한 목록을 영역 안에만 표시
	container: { flex: 1, overflow: 'hidden' },
	indicatorArea: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
	indicator: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
});

export default PullToRefreshContainer;

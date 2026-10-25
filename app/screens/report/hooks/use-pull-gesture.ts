import { useMemo } from 'react';

import { Platform } from 'react-native';

import type { PullEdge, PullStatus } from '@/types/pull-to-refresh';

import { Gesture } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

const PULL_MAX_DISTANCE = 160;
const PAN_ACTIVE_OFFSET = 8;
export const EDGE_EPSILON = 1;

export const isIOS = Platform.OS === 'ios';

interface Options {
	status: SharedValue<PullStatus>;
	distanceEdge: SharedValue<PullEdge>;
	panStart: SharedValue<number | null>;
	scrollY: SharedValue<number>;
	viewportHeight: SharedValue<number>;
	contentHeight: SharedValue<number>;
	track: (distance: number) => void;
	release: () => void;
}

/** 당긴 거리에 저항을 적용하는 함수 */
const resist = (drag: number) => {
	'worklet';

	return drag <= 0 ? 0 : (drag * PULL_MAX_DISTANCE) / (drag + PULL_MAX_DISTANCE);
};

/** 새로고침이 시작되기 전 상태인지 확인하는 함수 */
export const isPulling = (status: PullStatus) => {
	'worklet';

	return status === 'idle' || status === 'pulling' || status === 'armed';
};

/**
 * 당긴 거리를 계산하는 제스처 Hook
 * @param status 당기기 상태
 * @param distanceEdge 당기는 목록 끝
 * @param panStart 목록 끝에 도달한 시점의 손가락 이동 거리
 * @param scrollY 목록 스크롤 위치
 * @param viewportHeight 목록 높이
 * @param contentHeight 목록 콘텐츠 높이
 * @param track 당긴 거리를 반영할 함수
 * @param release 손을 뗄 때 실행할 함수
 */
const usePullGesture = ({
	status,
	distanceEdge,
	panStart,
	scrollY,
	viewportHeight,
	contentHeight,
	track,
	release,
}: Options) => {
	return useMemo(() => {
		const native = Gesture.Native();

		// iOS는 기본 바운스로 당긴 거리 계산
		if (isIOS) {
			return native;
		}

		const pan = Gesture.Pan()
			.activeOffsetY([-PAN_ACTIVE_OFFSET, PAN_ACTIVE_OFFSET])
			.simultaneousWithExternalGesture(native)
			.onUpdate((event) => {
				if (!isPulling(status.get())) {
					return;
				}

				let start = panStart.get();

				// 목록 끝에 도달한 지점부터 당긴 거리 계산
				if (start === null) {
					const maxScrollY = Math.max(0, contentHeight.get() - viewportHeight.get());

					if (event.translationY > 0 && scrollY.get() <= EDGE_EPSILON) {
						distanceEdge.set('top');
					} else if (event.translationY < 0 && scrollY.get() >= maxScrollY - EDGE_EPSILON) {
						distanceEdge.set('bottom');
					} else {
						return;
					}

					start = event.translationY;
					panStart.set(start);
				}

				const drag = distanceEdge.get() === 'top' ? event.translationY - start : start - event.translationY;

				track(resist(drag));

				// 반대로 당기면 시작점 다시 계산
				if (drag < 0) {
					panStart.set(null);
				}
			})
			.onEnd(() => {
				release();
			});

		return Gesture.Simultaneous(pan, native);
	}, [contentHeight, distanceEdge, panStart, release, scrollY, status, track, viewportHeight]);
};

export default usePullGesture;

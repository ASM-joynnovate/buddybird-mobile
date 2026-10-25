import { type Component, useCallback, useEffect, useRef, useState } from 'react';

import type { LayoutChangeEvent } from 'react-native';

import type { PullEdge, PullStatus, PullToRefreshState } from '@/types/pull-to-refresh';

import dayjs from 'dayjs';
import {
	scrollTo,
	useAnimatedProps,
	useAnimatedRef,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import usePullGesture, { EDGE_EPSILON, isIOS, isBeforeRefresh } from '@/screens/report/hooks/use-pull-gesture';
import { reportError } from '@/services/telemetry/client';
import { wait } from '@/utils/wait';

const PULL_REFRESH_DISTANCE = 64;
const CLOSE_MS = 260;
const SCROLL_THROTTLE_MS = 16;

interface HoldState {
	holdingOpen: boolean;
	edge: PullEdge;
}

interface Options {
	onRefresh: () => Promise<unknown>;
	holdHeight: number;
	minRefreshMs: number;
	finishMs: number;
}

/**
 * 당겨서 새로고침 Hook
 * @param onRefresh 새로고침할 때 실행할 함수
 * @param holdHeight 새로고침하는 동안 유지할 표시 영역 높이
 * @param minRefreshMs 새로고침 최소 표시 시간
 * @param finishMs 새로고침 완료 표시 시간
 */
const usePullToRefresh = <T extends Component>({ onRefresh, holdHeight, minRefreshMs, finishMs }: Options) => {
	const motionReduced = useReducedMotion();

	const scrollRef = useAnimatedRef<T>();

	const [holdState, setHoldState] = useState<HoldState>({ holdingOpen: false, edge: 'top' });

	const onRefreshRef = useRef(onRefresh);
	const mountedRef = useRef(true);

	const distance = useSharedValue(0);
	const distanceEdge = useSharedValue<PullEdge>('top');
	const insetTop = useSharedValue(0);
	const insetBottom = useSharedValue(0);
	const status = useSharedValue<PullStatus>('idle');
	const dragging = useSharedValue(false);
	const panStart = useSharedValue<number | null>(null);

	const scrollY = useSharedValue(0);
	const viewportHeight = useSharedValue(0);
	const contentHeight = useSharedValue(0);

	/** 당기기 상태 변경 */
	const changeStatus = useCallback(
		(nextStatus: PullStatus) => {
			'worklet';

			const holdingOpen = !isBeforeRefresh(nextStatus);

			// 표시 영역 유지 여부가 변경될 때만 화면 렌더링
			if (holdingOpen !== !isBeforeRefresh(status.get())) {
				const bottomGap = Math.max(0, viewportHeight.get() - contentHeight.get());

				// UI 스레드에서 iOS contentInset 변경
				insetTop.set(holdingOpen && distanceEdge.get() === 'top' ? holdHeight : 0);
				// 목록이 짧아도 0 위치까지 스크롤 허용
				insetBottom.set(holdingOpen ? bottomGap + (distanceEdge.get() === 'bottom' ? holdHeight : 0) : 0);

				scheduleOnRN(setHoldState, { holdingOpen, edge: distanceEdge.get() });
			}

			status.set(nextStatus);
		},
		[contentHeight, distanceEdge, holdHeight, insetBottom, insetTop, status, viewportHeight],
	);

	/** 당긴 거리 반영 */
	const updateDistance = useCallback(
		(nextDistance: number) => {
			'worklet';

			if (!isBeforeRefresh(status.get())) {
				return;
			}

			distance.set(nextDistance);

			const nextStatus = nextDistance <= 0 ? 'idle' : nextDistance >= PULL_REFRESH_DISTANCE ? 'armed' : 'pulling';

			if (nextStatus !== status.get()) {
				changeStatus(nextStatus);
			}
		},
		[distance, changeStatus, status],
	);

	/** 목록을 원래 위치로 이동 */
	const close = useCallback(() => {
		'worklet';

		changeStatus('closing');

		if (isIOS) {
			if (distance.get() <= EDGE_EPSILON) {
				distance.set(0);
				changeStatus('idle');

				return;
			}

			const endY = distanceEdge.get() === 'top' ? 0 : Math.max(0, contentHeight.get() - viewportHeight.get());

			scrollTo(scrollRef, 0, endY, !motionReduced);

			return;
		}

		if (motionReduced) {
			distance.set(0);
			changeStatus('idle');

			return;
		}

		distance.set(
			withTiming(0, { duration: CLOSE_MS }, (finished) => {
				if (finished) {
					changeStatus('idle');
				}
			}),
		);
	}, [contentHeight, distance, distanceEdge, changeStatus, motionReduced, scrollRef, viewportHeight]);

	/** 새로고침 실행 */
	const refresh = useCallback(async () => {
		const startedAt = dayjs();

		if (!isIOS) {
			distance.set(motionReduced ? holdHeight : withTiming(holdHeight, { duration: CLOSE_MS }));
		}

		try {
			await onRefreshRef.current();
		} catch (e) {
			reportError(e, 'pull_to_refresh');
		}

		const elapsed = dayjs().diff(startedAt);

		if (elapsed < minRefreshMs) {
			await wait(minRefreshMs - elapsed);
		}

		if (!mountedRef.current) {
			return;
		}

		scheduleOnUI(() => {
			'worklet';

			changeStatus('finishing');
		});

		await wait(finishMs);

		if (!mountedRef.current) {
			return;
		}

		scheduleOnUI(close);
	}, [close, distance, finishMs, holdHeight, minRefreshMs, changeStatus, motionReduced]);

	/** 손을 떼면 새로고침 실행 또는 원래 위치 복귀 */
	const release = useCallback(() => {
		'worklet';

		panStart.set(null);

		if (status.get() === 'armed') {
			changeStatus('refreshing');
			scheduleOnRN(refresh);

			return;
		}

		// iOS는 기본 바운스로 원래 위치 복귀
		if (status.get() === 'pulling' && !isIOS) {
			close();
		}
	}, [close, changeStatus, panStart, refresh, status]);

	const gesture = usePullGesture({
		status,
		distanceEdge,
		panStart,
		scrollY,
		viewportHeight,
		contentHeight,
		onPull: updateDistance,
		onRelease: release,
	});

	// Android는 목록 이동으로 표시 영역 확보
	const listStyle = useAnimatedStyle(() => {
		if (isIOS) {
			return {};
		}

		return { transform: [{ translateY: distanceEdge.get() === 'top' ? distance.get() : -distance.get() }] };
	});

	// iOS는 contentInset으로 표시 영역 확보
	const insetProps = useAnimatedProps(() => ({
		contentInset: { top: insetTop.get(), bottom: insetBottom.get(), left: 0, right: 0 },
	}));

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			const offset = event.contentOffset.y;
			const maxOffset = Math.max(0, event.contentSize.height - event.layoutMeasurement.height);

			scrollY.set(offset);

			// Android는 Pan 제스처로 당긴 거리 계산
			if (!isIOS) {
				return;
			}

			const topOverscroll = Math.max(0, -offset);
			const bottomOverscroll = Math.max(0, offset - maxOffset);

			if (status.get() === 'idle' && (topOverscroll > 0 || bottomOverscroll > 0)) {
				distanceEdge.set(topOverscroll > 0 ? 'top' : 'bottom');
			}

			const overscroll = distanceEdge.get() === 'top' ? topOverscroll : bottomOverscroll;

			if (!isBeforeRefresh(status.get())) {
				distance.set(overscroll);

				if (status.get() === 'closing' && overscroll <= EDGE_EPSILON) {
					distance.set(0);
					changeStatus('idle');
				}

				return;
			}

			// 관성 스크롤의 바운스는 당기기로 처리하지 않음
			if (dragging.get() || status.get() !== 'idle') {
				updateDistance(overscroll);
			} else {
				distance.set(overscroll);
			}
		},
		onBeginDrag: () => {
			dragging.set(true);
		},
		onEndDrag: () => {
			dragging.set(false);

			if (!isIOS) {
				return;
			}

			// closing 중 드래그가 끝나면 다시 이동
			if (status.get() === 'closing') {
				close();

				return;
			}

			release();
		},
	});

	const pullToRefresh: PullToRefreshState = {
		status,
		distance,
		distanceEdge,
		scrollY,
		viewportHeight,
		contentHeight,
		gesture,
	};

	/** 최신 새로고침 함수 저장 */
	useEffect(() => {
		onRefreshRef.current = onRefresh;
	});

	/** 마운트 여부 저장 */
	useEffect(() => {
		mountedRef.current = true;

		return () => {
			mountedRef.current = false;
		};
	}, []);

	const handleSaveViewportHeight = (event: LayoutChangeEvent) => {
		viewportHeight.set(event.nativeEvent.layout.height);
	};
	const handleSaveContentHeight = (_width: number, height: number) => {
		contentHeight.set(height);
	};

	const scrollProps = {
		ref: scrollRef,
		style: listStyle,
		onScroll: scrollHandler,
		scrollEventThrottle: SCROLL_THROTTLE_MS,
		onLayout: handleSaveViewportHeight,
		onContentSizeChange: handleSaveContentHeight,
		overScrollMode: 'never' as const,
		// 아래쪽 새로고침 시 항목 위치 유지
		maintainVisibleContentPosition:
			holdState.holdingOpen && holdState.edge === 'bottom' ? { minIndexForVisible: 0 } : undefined,
		...(isIOS && { alwaysBounceVertical: true, animatedProps: insetProps }),
	};

	return { pullToRefresh, scrollProps };
};

export default usePullToRefresh;

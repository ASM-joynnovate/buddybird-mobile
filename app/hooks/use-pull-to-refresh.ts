import { type Component, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type LayoutChangeEvent, Platform } from 'react-native';

import type { PullEdge, PullStatus } from '@/types/pull-to-refresh';

import dayjs from 'dayjs';
import { type ComposedGesture, Gesture, type GestureType } from 'react-native-gesture-handler';
import {
	type SharedValue,
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

import { reportError } from '@/services/telemetry/client';
import { wait } from '@/utils/wait';

const PULL_REFRESH_DISTANCE = 64;
const PULL_MAX_DISTANCE = 160;
const PAN_ACTIVE_OFFSET = 8;
const EDGE_EPSILON = 1;
const CLOSE_MS = 260;

const isIOS = Platform.OS === 'ios';

interface HoldState {
	holdingOpen: boolean;
	edge: PullEdge;
}

export interface PullToRefreshState {
	status: SharedValue<PullStatus>;
	distance: SharedValue<number>;
	distanceEdge: SharedValue<PullEdge>;
	scrollY: SharedValue<number>;
	viewportHeight: SharedValue<number>;
	contentHeight: SharedValue<number>;
	gesture: ComposedGesture | GestureType;
}

interface Options {
	onRefresh: () => Promise<unknown>;
	holdHeight: number;
	minRefreshMs: number;
	finishMs: number;
}

interface PullGestureOptions {
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
const isPulling = (status: PullStatus) => {
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
}: PullGestureOptions) => {
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

/**
 * 당겨서 새로고침 Hook
 * @param onRefresh 새로고침할 때 실행할 함수
 * @param holdHeight 새로고침하는 동안 유지할 표시 영역 높이
 * @param minRefreshMs 새로고침 최소 표시 시간
 * @param finishMs 새로고침 완료 표시 시간
 */
const usePullToRefresh = <T extends Component>({ onRefresh, holdHeight, minRefreshMs, finishMs }: Options) => {
	const reducedMotion = useReducedMotion();

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

	/** 당기기 상태 변경 */
	const moveTo = useCallback(
		(nextStatus: PullStatus) => {
			'worklet';

			const holdingOpen = !isPulling(nextStatus);

			// 표시 영역 유지 여부가 변경될 때만 화면 렌더링
			if (holdingOpen !== !isPulling(status.get())) {
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
	const track = useCallback(
		(nextDistance: number) => {
			'worklet';

			if (!isPulling(status.get())) {
				return;
			}

			distance.set(nextDistance);

			const next = nextDistance <= 0 ? 'idle' : nextDistance >= PULL_REFRESH_DISTANCE ? 'armed' : 'pulling';

			if (next !== status.get()) {
				moveTo(next);
			}
		},
		[distance, moveTo, status],
	);

	/** 목록을 원래 위치로 이동 */
	const close = useCallback(() => {
		'worklet';

		moveTo('closing');

		if (isIOS) {
			if (distance.get() <= EDGE_EPSILON) {
				distance.set(0);
				moveTo('idle');

				return;
			}

			const endY = distanceEdge.get() === 'top' ? 0 : Math.max(0, contentHeight.get() - viewportHeight.get());

			scrollTo(scrollRef, 0, endY, !reducedMotion);

			return;
		}

		if (reducedMotion) {
			distance.set(0);
			moveTo('idle');

			return;
		}

		distance.set(
			withTiming(0, { duration: CLOSE_MS }, (finished) => {
				if (finished) {
					moveTo('idle');
				}
			}),
		);
	}, [contentHeight, distance, distanceEdge, moveTo, reducedMotion, scrollRef, viewportHeight]);

	/** 새로고침 실행 */
	const refresh = useCallback(async () => {
		const startedAt = dayjs();

		if (!isIOS) {
			distance.set(reducedMotion ? holdHeight : withTiming(holdHeight, { duration: CLOSE_MS }));
		}

		try {
			await onRefreshRef.current();
		} catch (error) {
			reportError(error, 'pull_to_refresh');
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

			moveTo('finishing');
		});

		await wait(finishMs);

		if (!mountedRef.current) {
			return;
		}

		scheduleOnUI(close);
	}, [close, distance, finishMs, holdHeight, minRefreshMs, moveTo, reducedMotion]);

	/** 손을 떼면 새로고침 실행 또는 원래 위치 복귀 */
	const release = useCallback(() => {
		'worklet';

		panStart.set(null);

		if (status.get() === 'armed') {
			moveTo('refreshing');
			scheduleOnRN(refresh);

			return;
		}

		// iOS는 기본 바운스로 원래 위치 복귀
		if (status.get() === 'pulling' && !isIOS) {
			close();
		}
	}, [close, moveTo, panStart, refresh, status]);

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

			if (!isPulling(status.get())) {
				distance.set(overscroll);

				if (status.get() === 'closing' && overscroll <= EDGE_EPSILON) {
					distance.set(0);
					moveTo('idle');
				}

				return;
			}

			// 관성 스크롤의 바운스는 당기기로 처리하지 않음
			if (dragging.get() || status.get() !== 'idle') {
				track(overscroll);
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

	const gesture = usePullGesture({
		status,
		distanceEdge,
		panStart,
		scrollY,
		viewportHeight,
		contentHeight,
		track,
		release,
	});

	// Android는 목록 위치 이동으로 새로고침 표시 영역 확보
	const listStyle = useAnimatedStyle(() => {
		if (isIOS) {
			return {};
		}

		return { transform: [{ translateY: distanceEdge.get() === 'top' ? distance.get() : -distance.get() }] };
	});

	// iOS는 contentInset으로 새로고침 표시 영역 확보
	const insetProps = useAnimatedProps(() => ({
		contentInset: { top: insetTop.get(), bottom: insetBottom.get(), left: 0, right: 0 },
	}));

	const { holdingOpen } = holdState;

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => viewportHeight.set(event.nativeEvent.layout.height),
		[viewportHeight],
	);
	const handleContentSizeChange = useCallback(
		(_width: number, height: number) => contentHeight.set(height),
		[contentHeight],
	);

	const scrollProps = {
		ref: scrollRef,
		style: listStyle,
		onScroll: scrollHandler,
		scrollEventThrottle: 16,
		onLayout: handleLayout,
		onContentSizeChange: handleContentSizeChange,
		overScrollMode: 'never' as const,
		// 아래에서 새로고침할 때만 보이던 항목 위치 유지
		maintainVisibleContentPosition:
			holdingOpen && holdState.edge === 'bottom' ? { minIndexForVisible: 0 } : undefined,
		...(isIOS && { alwaysBounceVertical: true, animatedProps: insetProps }),
	};

	const pullToRefresh: PullToRefreshState = {
		status,
		distance,
		distanceEdge,
		scrollY,
		viewportHeight,
		contentHeight,
		gesture,
	};

	return { pullToRefresh, scrollProps };
};

export default usePullToRefresh;

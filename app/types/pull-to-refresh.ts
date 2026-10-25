import type { ComposedGesture, GestureType } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

export type PullEdge = 'top' | 'bottom';
export type PullStatus = 'idle' | 'pulling' | 'armed' | 'refreshing' | 'finishing' | 'closing';

export interface PullToRefreshIndicatorProps {
	edge: PullEdge;
	status: PullStatus;
	distance: SharedValue<number>;
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

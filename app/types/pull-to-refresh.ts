import type { SharedValue } from 'react-native-reanimated';

export type PullEdge = 'top' | 'bottom';
export type PullStatus = 'idle' | 'pulling' | 'armed' | 'refreshing' | 'finishing' | 'closing';

export interface PullToRefreshIndicatorProps {
	edge: PullEdge;
	status: PullStatus;
	distance: SharedValue<number>;
}

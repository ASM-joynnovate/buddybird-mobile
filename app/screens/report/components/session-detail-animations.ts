import { Easing } from 'react-native-reanimated';

/** 빠르게 출발해 부드럽게 멈추는 속도 곡선 */
export const burstEasing = Easing.bezier(0.16, 1, 0.3, 1);

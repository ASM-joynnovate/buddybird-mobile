import { ActivityIndicator, StyleSheet } from 'react-native';

import type { PullEdge, PullStatus } from '@/types/pull-to-refresh';

import useRefreshMessage from '@/hooks/use-refresh-message';

import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { colors } from '@/theme';

import { HOLD_SCENE_HEIGHT } from '@/components/buddy-refresh/constants';
import BuddyRefreshMessage, { MESSAGE_SPACE } from '@/components/buddy-refresh/message';

const THROBBER_SIZE = 20;

interface Props {
	edge: PullEdge;
	status: PullStatus;
	distance: SharedValue<number>;
}

/**
 * 회전하는 로딩 표시 새로고침 컴포넌트
 * @param edge 새로고침 표시 위치
 * @param status 당기기 상태
 * @param distance 새로고침 표시 영역의 높이
 */
const BuddyRefreshThrobberIndicator = ({ edge, status, distance }: Props) => {
	const { message, messageProgress } = useRefreshMessage(status);

	const throbberStyle = useAnimatedStyle(() => {
		const sceneHeight = edge === 'top' ? distance.get() - MESSAGE_SPACE * messageProgress.get() : HOLD_SCENE_HEIGHT;

		return { transform: [{ translateY: (sceneHeight - THROBBER_SIZE) / 2 }] };
	});

	return (
		<>
			<Animated.View style={[styles.throbber, throbberStyle]}>
				<ActivityIndicator color={colors.orange} />
			</Animated.View>

			<BuddyRefreshMessage message={message} progress={messageProgress} distance={distance} />
		</>
	);
};

const styles = StyleSheet.create({
	throbber: { position: 'absolute', top: 0, right: 0, left: 0, alignItems: 'center' },
});

export default BuddyRefreshThrobberIndicator;

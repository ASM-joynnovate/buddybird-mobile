import { ActivityIndicator, StyleSheet } from 'react-native';

import type { PullEdge, PullStatus } from '@/types/pull-to-refresh';

import useRefreshMessage from '@/hooks/use-refresh-message';

import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { colors } from '@/theme';

import BuddyRefreshMessage, { MESSAGE_SPACE } from '@/components/buddy-refresh/message';
import { HOLD_SCENE_HEIGHT } from '@/components/buddy-refresh/options';

const THROBBER_SIZE = 20;

interface Props {
	edge: PullEdge;
	status: PullStatus;
	distance: SharedValue<number>;
}

/**
 * Throbber 새로고침 표시 컴포넌트
 * @param edge 새로고침 표시 위치
 * @param status 당기기 상태
 * @param distance 새로고침 표시 영역의 높이
 */
const ThrobberRefreshIndicator = ({ edge, status, distance }: Props) => {
	const { message, messageShown } = useRefreshMessage(status);

	const throbberStyle = useAnimatedStyle(() => {
		const sceneHeight = edge === 'top' ? distance.get() - MESSAGE_SPACE * messageShown.get() : HOLD_SCENE_HEIGHT;

		return { transform: [{ translateY: (sceneHeight - THROBBER_SIZE) / 2 }] };
	});

	return (
		<>
			<Animated.View style={[styles.throbber, throbberStyle]}>
				<ActivityIndicator color={colors.orange} />
			</Animated.View>

			<BuddyRefreshMessage message={message} messageShown={messageShown} distance={distance} />
		</>
	);
};

const styles = StyleSheet.create({
	throbber: { position: 'absolute', top: 0, right: 0, left: 0, alignItems: 'center' },
});

export default ThrobberRefreshIndicator;

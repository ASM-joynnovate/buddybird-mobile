import { StyleSheet } from 'react-native';

import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { font } from '@/theme';

import { Copy } from '@/components/ui/copy';

const MESSAGE_HEIGHT = 20;
const MESSAGE_GAP = 10;
const MESSAGE_BOTTOM = 12;
const MESSAGE_RISE = 4;

export const MESSAGE_SPACE = MESSAGE_HEIGHT + MESSAGE_GAP + MESSAGE_BOTTOM;

interface Props {
	message: string;
	messageShown: SharedValue<number>;
	distance: SharedValue<number>;
}

/**
 * 새로고침 문구 컴포넌트
 * @param message 표시할 문구
 * @param messageShown 문구 표시 진행률
 * @param distance 새로고침 표시 영역의 높이
 */
const BuddyRefreshMessage = ({ message, messageShown, distance }: Props) => {
	const messageStyle = useAnimatedStyle(() => ({
		opacity: messageShown.get(),
		transform: [
			{ translateY: distance.get() - MESSAGE_BOTTOM - MESSAGE_HEIGHT + (1 - messageShown.get()) * MESSAGE_RISE },
		],
	}));

	return (
		<Animated.View accessibilityLiveRegion="polite" style={[styles.container, messageStyle]}>
			<Copy numberOfLines={1} style={styles.message}>
				{message}
			</Copy>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: { position: 'absolute', top: 0, right: 0, left: 0 },
	message: { fontFamily: font.extraBold, fontSize: 14, lineHeight: MESSAGE_HEIGHT, textAlign: 'center' },
});

export default BuddyRefreshMessage;

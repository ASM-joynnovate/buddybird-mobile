import { StyleSheet } from 'react-native';

import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { font } from '@/theme';

import { Copy } from '@/components/ui/copy';

const MESSAGE_HEIGHT = 20;
const MESSAGE_BOTTOM = 12;
const MESSAGE_RISE = 4;

export const MESSAGE_SPACE = 42;

interface Props {
	message: string;
	shown: SharedValue<number>;
	distance: SharedValue<number>;
}

/**
 * 새로고침 문구 컴포넌트
 * @param message 표시할 문구
 * @param shown 문구 표시 진행률
 * @param distance 새로고침 표시 영역의 높이
 */
const BuddyRefreshMessage = ({ message, shown, distance }: Props) => {
	const messageStyle = useAnimatedStyle(() => ({
		opacity: shown.get(),
		transform: [
			{ translateY: distance.get() - MESSAGE_BOTTOM - MESSAGE_HEIGHT + (1 - shown.get()) * MESSAGE_RISE },
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

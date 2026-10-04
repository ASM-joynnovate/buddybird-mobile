import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import Animated, { type AnimatedRef, type AnimatedStyle } from 'react-native-reanimated';

import Mascot from '@/components/mascot';
import { SpeechBubble } from '@/components/ui/speech-bubble';

interface Props {
	message: string;
	mascotRef?: AnimatedRef<Animated.View>;
	mascotStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
	bubbleStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
}

/**
 * 마스코트 말풍선 컴포넌트
 * @param message 말풍선 문구
 * @param mascotRef 마스코트의 화면 위치를 잴 때 쓰는 ref
 * @param mascotStyle 마스코트에 더할 스타일
 * @param bubbleStyle 말풍선에 더할 스타일
 */
const BuddySays = ({ message, mascotRef, mascotStyle, bubbleStyle }: Props) => {
	return (
		<View style={styles.container}>
			<Animated.View ref={mascotRef} style={mascotStyle}>
				<Mascot size={72} />
			</Animated.View>

			<Animated.View style={[styles.bubble, bubbleStyle]}>
				<SpeechBubble pointerSide="left" typing>
					{message}
				</SpeechBubble>
			</Animated.View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
	bubble: { flex: 1, minWidth: 0, marginTop: 4 },
});

export default BuddySays;

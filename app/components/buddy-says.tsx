import { StyleSheet, View } from 'react-native';

import Mascot from '@/components/mascot';
import { SpeechBubble } from '@/components/ui/speech-bubble';

interface Props {
	message: string;
}

/**
 * 마스코트 말풍선 컴포넌트
 * @param message 말풍선 문구
 */
const BuddySays = ({ message }: Props) => {
	return (
		<View style={styles.container}>
			<Mascot size={72} />

			<SpeechBubble pointerSide="left" typing style={styles.bubble}>
				{message}
			</SpeechBubble>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
	bubble: { flex: 1, minWidth: 0, marginTop: 4 },
});

export default BuddySays;

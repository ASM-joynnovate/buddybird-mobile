import { StyleSheet, View } from 'react-native';

import Mascot from '@/components/mascot';
import { SpeechBubble } from '@/components/ui/speech-bubble';

interface Props {
	message: string;
}

/**
 * 마스코트 옆 말풍선에 문구가 한 글자씩 나타나는 컴포넌트
 * @param message 말풍선에 보여 줄 문구
 */
const BuddySays = ({ message }: Props) => {
	return (
		<View style={styles.container}>
			{/*왼쪽 마스코트*/}
			<Mascot size={72} />

			{/*문구가 한 글자씩 나타나는 말풍선*/}
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

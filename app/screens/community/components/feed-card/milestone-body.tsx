import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import { font } from '@/theme';

import { Copy } from '@/components/ui/copy';

interface Props {
	message: ReactNode;
	art: ReactNode;
}

/**
 * 달성 피드 내용 컴포넌트
 * @param message 달성 문구
 * @param art 오른쪽 그림
 */
const FeedCardMilestoneBody = ({ message, art }: Props) => {
	return (
		<View style={styles.container}>
			<Copy style={styles.message}>{message}</Copy>
			<View style={styles.artContainer}>{art}</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
	message: { flex: 1, minWidth: 0, fontFamily: font.bold, fontSize: 16, lineHeight: 24 },
	artContainer: { width: 80, alignItems: 'center' },
});

export const milestoneStyles = StyleSheet.create({
	emphasis: { fontFamily: font.black },
});

export default FeedCardMilestoneBody;

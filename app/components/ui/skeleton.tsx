import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

interface Props {
	blockCount?: number;
	height?: number;
}

export const Skeleton = ({ blockCount = 3, height = 72 }: Props) => {
	return (
		<View style={styles.container} accessibilityElementsHidden>
			{Array.from({ length: blockCount }, (_, index) => (
				<View key={index} style={[styles.block, { height }]} />
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { gap: 10 },
	block: { borderRadius: radius.card, backgroundColor: colors.surface },
});

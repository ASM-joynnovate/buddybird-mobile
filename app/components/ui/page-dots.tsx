import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

interface Props {
	count: number;
	currentIndex: number;
	label: string;
}

export function PageDots({ count, currentIndex, label }: Props) {
	if (count < 2) {
		return null;
	}

	return (
		<View style={styles.dots} accessible accessibilityLabel={label}>
			{Array.from({ length: count }, (_, dotIndex) => (
				<View key={dotIndex} style={[styles.dot, dotIndex === currentIndex && styles.dotCurrent]} />
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	dots: { flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center' },
	dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.border },
	dotCurrent: { width: 18, backgroundColor: colors.orange },
});

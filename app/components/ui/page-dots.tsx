import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

interface Props {
	count: number;
	index: number;
	label: string;
}

export function PageDots({ count, index, label }: Props) {
	if (count < 2) {
		return null;
	}

	return (
		<View style={styles.dots} accessible accessibilityLabel={label}>
			{Array.from({ length: count }, (_, item) => (
				<View key={item} style={[styles.page, item === index && styles.pageOn]} />
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	dots: { flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center' },
	page: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.border },
	pageOn: { width: 18, backgroundColor: colors.orange },
});

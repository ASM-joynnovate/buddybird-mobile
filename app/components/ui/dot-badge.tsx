import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

export const DotBadge = () => {
	return <View style={styles.dot} />;
};

const styles = StyleSheet.create({
	dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error },
});

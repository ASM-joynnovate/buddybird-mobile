import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

const sizes = { small: 4, medium: 8 } as const;

interface Props {
	size?: keyof typeof sizes;
}

export const DotBadge = ({ size = 'medium' }: Props) => {
	return <View style={[styles.dot, { width: sizes[size], height: sizes[size] }]} />;
};

const styles = StyleSheet.create({
	dot: { borderRadius: radius.pill, backgroundColor: colors.error },
});

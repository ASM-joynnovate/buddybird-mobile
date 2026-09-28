import { StyleSheet } from 'react-native';

import { colors } from '@/theme';

import { Copy } from '@/components/ui/copy';

interface Props {
	message?: string | null;
}

export function InlineError({ message }: Props) {
	if (!message) {
		return null;
	}

	return (
		<Copy accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.error}>
			{message}
		</Copy>
	);
}

const styles = StyleSheet.create({
	error: { color: colors.brand, fontSize: 15, lineHeight: 21, marginTop: 10 },
});

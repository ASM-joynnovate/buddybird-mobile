import type { PropsWithChildren } from 'react';

import { StyleSheet, View } from 'react-native';

import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';

interface Props {
	title?: string;
}

export function ItemGroup({ children, title }: PropsWithChildren<Props>) {
	return (
		<View style={styles.group}>
			{title ? (
				<Copy accessibilityRole="header" style={styles.groupTitle}>
					{title}
				</Copy>
			) : null}
			<View style={styles.list}>{children}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	group: { gap: 10 },
	groupTitle: { fontFamily: font.black, fontSize: 18, lineHeight: 24 },
	list: {
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: radius.card,
		borderCurve: 'continuous',
		overflow: 'hidden',
		backgroundColor: colors.background,
	},
});

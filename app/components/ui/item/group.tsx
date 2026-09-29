import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';

interface Props {
	title?: string;
	children: ReactNode;
}

export const ItemGroup = ({ children, title }: Props) => {
	return (
		<View style={styles.container}>
			{!!title && (
				<Copy accessibilityRole="header" style={styles.groupTitle}>
					{title}
				</Copy>
			)}

			<View style={styles.list}>{children}</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { gap: 10 },
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

import { StyleSheet, View } from 'react-native';

import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';

const variants = {
	primary: { face: colors.orangeSelected, edge: colors.orange, text: colors.orangeDark },
	muted: { face: colors.surface, edge: colors.border, text: colors.muted },
} as const;

type TagVariant = keyof typeof variants;

interface Props {
	label: string;
	variant?: TagVariant;
}

export function Tag({ label, variant = 'muted' }: Props) {
	const palette = variants[variant];

	return (
		<View style={[styles.tag, { backgroundColor: palette.face, borderColor: palette.edge }]}>
			<Copy numberOfLines={1} style={[styles.text, { color: palette.text }]}>
				{label}
			</Copy>
		</View>
	);
}

const styles = StyleSheet.create({
	tag: {
		alignSelf: 'flex-start',
		flexShrink: 1,
		borderWidth: 2,
		borderRadius: radius.pill,
		paddingHorizontal: 10,
		paddingVertical: 2,
	},
	text: { fontFamily: font.extraBold, fontSize: 13 },
});

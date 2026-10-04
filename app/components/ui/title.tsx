import type { ReactNode } from 'react';

import { type StyleProp, StyleSheet, type TextStyle } from 'react-native';

import { font } from '@/theme';

import { Copy } from '@/components/ui/copy';

interface Props {
	style?: StyleProp<TextStyle>;
	children: ReactNode;
}

export const Title = ({ children, style }: Props) => {
	return (
		<Copy accessibilityRole="header" style={[styles.title, style]}>
			{children}
		</Copy>
	);
};

const styles = StyleSheet.create({
	title: { fontFamily: font.black, fontSize: 26, lineHeight: 32 },
});

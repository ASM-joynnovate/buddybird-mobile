import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { InlineError } from '@/components/ui/inline-error';
import { ui } from '@/components/ui/styles';

interface Props extends TextInputProps {
	label?: string;
	errorMessage?: string | null;
}

export const TextField = ({ label, errorMessage, style, accessibilityLabel, ...props }: Props) => {
	return (
		<View>
			{/*이름과 입력 칸*/}
			{!!label && <Copy style={ui.label}>{label}</Copy>}
			<TextInput
				{...props}
				accessibilityLabel={accessibilityLabel ?? label}
				allowFontScaling={false}
				placeholderTextColor={colors.muted}
				style={[styles.input, errorMessage && { borderColor: colors.error }, style]}
			/>

			{/*오류 문구*/}
			<InlineError message={errorMessage} />
		</View>
	);
};

const styles = StyleSheet.create({
	input: {
		minHeight: 50,
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: 14,
		paddingHorizontal: 16,
		paddingVertical: 10,
		fontFamily: font.bold,
		fontSize: 16,
		color: colors.text,
	},
});

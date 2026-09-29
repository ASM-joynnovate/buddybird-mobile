import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import { colors, font } from '@/theme';

import { Checkbox } from '@/components/ui/checkbox';
import { Copy } from '@/components/ui/copy';
import type { ItemBaseProps } from '@/components/ui/item/label';
import { itemStyles } from '@/components/ui/item/styles';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props extends ItemBaseProps {
	checked: boolean;
	disabled?: boolean;
	trailing?: ReactNode;
	caption?: string;
	captionVariant?: 'primary' | 'muted';
	onToggle: () => void;
}

export const ItemCheckbox = ({
	checked,
	onToggle,
	disabled,
	trailing,
	caption,
	captionVariant = 'muted',
	...props
}: Props) => {
	return (
		<PressableSurface
			accessibilityRole="checkbox"
			accessibilityLabel={props.label}
			accessibilityState={{ checked }}
			disabled={disabled}
			onPress={onToggle}
			variant="plain"
			depth="none"
			cornerRadius="none"
			style={!props.first && itemStyles.divider}
			contentStyle={itemStyles.pressRow}
		>
			{/*작은 안내 문구, 이름, 설명*/}
			<View style={itemStyles.textContainer}>
				{!!caption && (
					<Copy style={[styles.caption, captionVariant === 'primary' && styles.captionPrimary]}>
						{caption}
					</Copy>
				)}
				<Copy style={itemStyles.label}>{props.label}</Copy>
				{!!props.detail && <Copy style={itemStyles.detail}>{props.detail}</Copy>}
			</View>

			{/*오른쪽 끝 내용과 체크 표시*/}
			{trailing}
			<Checkbox checked={checked} disabled={disabled} onPress={onToggle} />
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	caption: { fontFamily: font.extraBold, fontSize: 12, color: colors.muted },
	captionPrimary: { color: colors.orangeDark },
});

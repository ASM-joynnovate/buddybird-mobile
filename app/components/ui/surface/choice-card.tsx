import { StyleSheet } from 'react-native';

import { PressableSurface, type PressableSurfaceProps } from '@/components/ui/surface/pressable-surface';

interface Props extends PressableSurfaceProps {
	selected: boolean;
}

export const ChoiceCard = ({ selected, contentStyle, ...props }: Props) => {
	return (
		<PressableSurface
			{...props}
			depth="medium"
			variant={selected ? 'selected' : 'neutral'}
			accessibilityRole="radio"
			accessibilityState={{ checked: selected, selected }}
			contentStyle={[styles.card, contentStyle]}
		/>
	);
};

const styles = StyleSheet.create({
	card: { padding: 16 },
});

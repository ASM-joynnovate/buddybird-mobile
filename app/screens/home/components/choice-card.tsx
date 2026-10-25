import { StyleSheet } from 'react-native';

import { PressableSurface, type PressableSurfaceProps } from '@/components/ui/surface/pressable-surface';

interface Props extends PressableSurfaceProps {
	selected: boolean;
}

/**
 * 누르면 선택되는 라디오 카드 컴포넌트
 * @param selected 선택 여부
 * @param contentStyle 카드 내용 스타일
 */
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

import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

import { CheckMark } from '@/components/ui/check-mark';
import { Copy } from '@/components/ui/copy';
import { ItemGroup } from '@/components/ui/item/group';
import { itemStyles } from '@/components/ui/item/styles';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Option<Value extends string> {
	value: Value;
	label: string;
}

interface Props<Value extends string> {
	options: Option<Value>[];
	selectedValue: Value | null;
	onSelect: (value: Value) => void;
}

/**
 * 선택 원이 있는 라디오 목록 컴포넌트
 * @param options 선택지 목록
 * @param selectedValue 선택한 값
 * @param onSelect 선택지를 누를 때 실행할 함수
 */
export const RadioList = <Value extends string>({ options, selectedValue, onSelect }: Props<Value>) => {
	return (
		<ItemGroup>
			{options.map((option, index) => {
				const optionSelected = option.value === selectedValue;

				return (
					<PressableSurface
						key={option.value}
						accessibilityRole="radio"
						accessibilityLabel={option.label}
						accessibilityState={{ checked: optionSelected }}
						onPress={() => onSelect(option.value)}
						variant="plain"
						depth="none"
						cornerRadius="none"
						style={index > 0 && itemStyles.divider}
						contentStyle={[itemStyles.pressRow, styles.optionRow]}
					>
						<Copy style={[itemStyles.label, styles.label, optionSelected && styles.labelSelected]}>
							{option.label}
						</Copy>

						<View style={[styles.circle, optionSelected && styles.circleSelected]}>
							{optionSelected && <CheckMark size="small" color={colors.onFilled} />}
						</View>
					</PressableSurface>
				);
			})}
		</ItemGroup>
	);
};

const styles = StyleSheet.create({
	optionRow: { minHeight: 48 },
	label: { flex: 1, fontSize: 15 },
	labelSelected: { color: colors.orangeDark },
	circle: {
		width: 20,
		height: 20,
		borderRadius: 10,
		borderWidth: 2,
		borderColor: colors.border,
		alignItems: 'center',
		justifyContent: 'center',
	},
	circleSelected: { borderColor: colors.orange, backgroundColor: colors.orange },
});

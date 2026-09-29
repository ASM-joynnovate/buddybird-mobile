import { StyleSheet, View } from 'react-native';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { WHEEL_ITEM_HEIGHT, WheelPickerWheel } from '@/components/ui/wheel-picker/wheel';

export const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
export const MINUTE_STEPS = Array.from({ length: 12 }, (_, index) => index * 5);

interface WheelColumn {
	key: string;
	label: string;
	value: number;
	values: readonly number[];
	unit?: string;
	onChange: (value: number) => void;
}

interface Props {
	columns: readonly WheelColumn[];
}

export const WheelPicker = ({ columns }: Props) => {
	return (
		<View style={styles.container}>
			{/*가운데 선택 표시*/}
			<View pointerEvents="none" style={styles.selection} />

			{columns.map((column) => (
				<View key={column.key} style={styles.columnRow}>
					<WheelPickerWheel
						label={column.label}
						value={column.value}
						values={column.values}
						onChange={column.onChange}
					/>
					{!!column.unit && <Copy style={styles.unit}>{column.unit}</Copy>}
				</View>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
	selection: {
		position: 'absolute',
		top: WHEEL_ITEM_HEIGHT * 2,
		height: WHEEL_ITEM_HEIGHT,
		left: 0,
		right: 0,
		borderTopWidth: 2,
		borderBottomWidth: 2,
		borderColor: colors.orange,
		backgroundColor: colors.wheelSelection,
	},
	columnRow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 4 },
	unit: { fontFamily: font.extraBold, fontSize: 16, minWidth: 22 },
});

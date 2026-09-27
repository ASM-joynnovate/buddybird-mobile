import { StyleSheet, View } from "react-native"

import { Copy } from "@/components/ui/text"
import { WHEEL_ITEM_HEIGHT, Wheel } from "@/components/ui/wheel-picker/wheel"
import { colors, font } from "@/theme"

export const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
export const MINUTE_STEPS = Array.from({ length: 12 }, (_, index) => index * 5)

interface WheelColumn {
	key: string
	label: string
	value: number
	values: readonly number[]
	unit?: string
	onChange(value: number): void
}

interface Props {
	columns: readonly WheelColumn[]
}

export function WheelPicker({ columns }: Props) {
	return (
		<View style={styles.row}>
			<View pointerEvents="none" style={styles.selection} />
			{columns.map((column) => (
				<View key={column.key} style={styles.column}>
					<Wheel
						label={column.label}
						value={column.value}
						values={column.values}
						onChange={column.onChange}
					/>
					{column.unit ? <Copy style={styles.unit}>{column.unit}</Copy> : null}
				</View>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
	selection: {
		position: "absolute",
		top: WHEEL_ITEM_HEIGHT * 2,
		height: WHEEL_ITEM_HEIGHT,
		left: 0,
		right: 0,
		borderWidth: 2,
		borderRadius: 12,
		borderColor: colors.orange,
		backgroundColor: colors.wheelSelection,
	},
	column: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 4 },
	unit: { fontFamily: font.extraBold, fontSize: 16, minWidth: 22 },
})

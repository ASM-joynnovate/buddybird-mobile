import { BottomSheetBackdrop, type BottomSheetBackdropProps } from "@gorhom/bottom-sheet"
import { StyleSheet } from "react-native"

import { colors } from "@/theme"

export function Backdrop(props: BottomSheetBackdropProps) {
	return (
		<BottomSheetBackdrop
			{...props}
			appearsOnIndex={0}
			disappearsOnIndex={-1}
			opacity={1}
			style={[props.style, styles.backdrop]}
		/>
	)
}

const styles = StyleSheet.create({
	backdrop: { backgroundColor: colors.scrim },
})

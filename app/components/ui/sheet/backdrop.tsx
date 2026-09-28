import { StyleSheet } from 'react-native';

import { BottomSheetBackdrop, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import { colors } from '@/theme';

interface Props extends BottomSheetBackdropProps {}

export function Backdrop(props: Props) {
	return (
		<BottomSheetBackdrop
			{...props}
			appearsOnIndex={0}
			disappearsOnIndex={-1}
			opacity={1}
			style={[props.style, styles.backdrop]}
		/>
	);
}

const styles = StyleSheet.create({
	backdrop: { backgroundColor: colors.scrim },
});

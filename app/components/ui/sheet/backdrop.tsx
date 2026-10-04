import { StyleSheet } from 'react-native';

import { BottomSheetBackdrop, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import { colors } from '@/theme';

interface Props extends BottomSheetBackdropProps {
	pressBehavior?: 'close' | 'none';
}

export const SheetBackdrop = ({ pressBehavior = 'close', ...props }: Props) => {
	return (
		<BottomSheetBackdrop
			{...props}
			appearsOnIndex={0}
			disappearsOnIndex={-1}
			opacity={1}
			pressBehavior={pressBehavior}
			style={[props.style, styles.backdrop]}
		/>
	);
};

export const FixedSheetBackdrop = (props: BottomSheetBackdropProps) => {
	return <SheetBackdrop {...props} pressBehavior="none" />;
};

const styles = StyleSheet.create({
	backdrop: { backgroundColor: colors.backdrop },
});

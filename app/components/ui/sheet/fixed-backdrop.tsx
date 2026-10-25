import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import { SheetBackdrop } from '@/components/ui/sheet/backdrop';

interface Props extends BottomSheetBackdropProps {}

export const SheetFixedBackdrop = (props: Props) => {
	return <SheetBackdrop {...props} pressBehavior="none" />;
};

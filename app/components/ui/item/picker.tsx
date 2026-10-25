import { type ReactNode, useState } from 'react';

import type { LucideIcon } from 'lucide-react-native';

import { Item } from '@/components/ui/item';
import { Sheet } from '@/components/ui/sheet';

interface ItemPickerItem {
	label: string;
	value?: string;
	icon?: LucideIcon;
	isFirstInGroup?: boolean;
	disabled?: boolean;
}

interface ItemPickerSheet {
	title: string;
	description?: string;
	listLayout?: boolean;
	onOpened?: () => void;
}

interface Props {
	itemProps: ItemPickerItem;
	sheet: ItemPickerSheet;
	children: (close: () => void) => ReactNode;
}

export const ItemPicker = ({ itemProps, sheet, children }: Props) => {
	const [sheetOpen, setSheetOpen] = useState(false);

	const handleClose = () => setSheetOpen(false);

	return (
		<>
			<Item {...itemProps} onPress={() => setSheetOpen(true)} />

			<Sheet
				visible={sheetOpen}
				title={sheet.title}
				description={sheet.description}
				isListLayout={sheet.listLayout}
				onOpened={sheet.onOpened}
				onClose={handleClose}
			>
				{children(handleClose)}
			</Sheet>
		</>
	);
};

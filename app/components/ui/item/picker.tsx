import { type ReactNode, useState } from 'react';

import type { LucideIcon } from 'lucide-react-native';

import { Item } from '@/components/ui/item';
import { Sheet } from '@/components/ui/sheet';

interface ItemPickerItem {
	label: string;
	value?: string;
	icon?: LucideIcon;
	firstInGroup?: boolean;
	disabled?: boolean;
}

interface ItemPickerSheet {
	title: string;
	description?: string;
	listLayout?: boolean;
	onOpened?: () => void;
}

interface Props {
	item: ItemPickerItem;
	sheet: ItemPickerSheet;
	children: (close: () => void) => ReactNode;
}

export const ItemPicker = ({ item, sheet, children }: Props) => {
	const [sheetOpen, setSheetOpen] = useState(false);

	const handleClose = () => setSheetOpen(false);

	return (
		<>
			<Item {...item} onPress={() => setSheetOpen(true)} />

			<Sheet
				visible={sheetOpen}
				title={sheet.title}
				description={sheet.description}
				listLayout={sheet.listLayout}
				onOpened={sheet.onOpened}
				onClose={handleClose}
			>
				{children(handleClose)}
			</Sheet>
		</>
	);
};

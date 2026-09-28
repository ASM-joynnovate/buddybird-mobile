import { type ReactNode, useState } from 'react';

import type { LucideIcon } from 'lucide-react-native';

import { Item } from '@/components/ui/item';
import { Sheet } from '@/components/ui/sheet';

interface Props {
	item: { label: string; value?: string; icon?: LucideIcon; first?: boolean; disabled?: boolean };
	sheet: { title: string; listLayout?: boolean; onOpened?: () => void };
	children: (close: () => void) => ReactNode;
}

export const ItemPicker = ({ item, sheet, children }: Props) => {
	const [open, setOpen] = useState(false);

	const handleClose = () => setOpen(false);

	return (
		<>
			{/*이름과 고른 값*/}
			<Item {...item} onPress={() => setOpen(true)} />

			{/*누르면 아래에서 올라오는 제목과 선택지*/}
			<Sheet
				visible={open}
				title={sheet.title}
				listLayout={sheet.listLayout}
				onOpened={sheet.onOpened}
				onClose={handleClose}
			>
				{children(handleClose)}
			</Sheet>
		</>
	);
};

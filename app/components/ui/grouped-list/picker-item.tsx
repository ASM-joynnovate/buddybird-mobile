import { type ReactNode, useState } from 'react';

import type { LucideIcon } from 'lucide-react-native';

import { GroupedListNavItem } from '@/components/ui/grouped-list/nav-item';
import { Sheet } from '@/components/ui/sheet';

interface Props {
	item: { label: string; value?: string; icon?: LucideIcon; first?: boolean; disabled?: boolean };
	sheet: { title: string; list?: boolean; onOpened?(): void };
	children(close: () => void): ReactNode;
}

export function GroupedListPickerItem({ item, sheet, children }: Props) {
	const [open, setOpen] = useState(false);

	const close = () => setOpen(false);

	return (
		<>
			<GroupedListNavItem {...item} onPress={() => setOpen(true)} />
			<Sheet visible={open} title={sheet.title} list={sheet.list} onOpened={sheet.onOpened} onClose={close}>
				{children(close)}
			</Sheet>
		</>
	);
}

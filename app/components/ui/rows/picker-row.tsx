import { type ReactNode, useState } from "react"

import type { IconName } from "@/components/ui/icon"
import { NavRow } from "@/components/ui/rows/nav-row"
import { Sheet } from "@/components/ui/sheet"

interface Props {
	row: { label: string; value?: string; icon?: IconName; first?: boolean; disabled?: boolean }
	sheet: { title: string; list?: boolean; onOpened?(): void }
	children(close: () => void): ReactNode
}

export function PickerRow({ row, sheet, children }: Props) {
	const [open, setOpen] = useState(false)

	const close = () => setOpen(false)

	return (
		<>
			<NavRow {...row} onPress={() => setOpen(true)} />
			<Sheet
				visible={open}
				title={sheet.title}
				list={sheet.list}
				onOpened={sheet.onOpened}
				onClose={close}
			>
				{children(close)}
			</Sheet>
		</>
	)
}

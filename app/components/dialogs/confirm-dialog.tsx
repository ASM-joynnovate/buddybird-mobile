import type { PropsWithChildren } from "react"
import { View } from "react-native"

import { Dialog } from "@/components/dialogs/dialog"
import { Button } from "@/components/ui/button"
import { InlineError } from "@/components/ui/inline-error"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"

export function ConfirmDialog({
	visible,
	title,
	message,
	confirmLabel,
	cancelLabel,
	busy,
	error,
	onConfirm,
	onClose,
	children,
}: PropsWithChildren<{
	visible: boolean
	title: string
	message?: string
	confirmLabel: string
	cancelLabel: string
	busy?: boolean
	error?: string | null
	onConfirm(): void
	onClose(): void
}>) {
	return (
		<Dialog
			visible={visible}
			title={title}
			onClose={busy ? () => {} : onClose}
			footer={
				<View style={ui.actions}>
					<Button
						label={cancelLabel}
						variant="secondary"
						compact
						disabled={busy}
						onPress={onClose}
						style={ui.action}
					/>
					<Button
						label={confirmLabel}
						compact
						loading={busy}
						onPress={onConfirm}
						style={ui.action}
					/>
				</View>
			}
		>
			{message ? <Copy>{message}</Copy> : null}
			{children}
			<InlineError message={error} />
		</Dialog>
	)
}

import type { PropsWithChildren } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Dialog } from "@/components/dialogs/dialog"
import { Button } from "@/components/ui/button"
import { InlineError } from "@/components/ui/inline-error"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"

interface Props {
	visible: boolean
	text: { title: string; message?: string; confirm?: string; cancel?: string }
	state?: { busy?: boolean; error?: string | null }
	onConfirm(): void
	onClose(): void
}

export function ConfirmDialog({
	visible,
	text,
	state,
	onConfirm,
	onClose,
	children,
}: PropsWithChildren<Props>) {
	const { t } = useTranslation()

	const busy = state?.busy ?? false

	return (
		<Dialog
			visible={visible}
			title={text.title}
			onClose={busy ? () => {} : onClose}
			footer={
				<View style={ui.actions}>
					<Button
						label={text.cancel ?? t("common.cancel")}
						variant="secondary"
						compact
						disabled={busy}
						onPress={onClose}
						style={ui.action}
					/>
					<Button
						label={text.confirm ?? t("common.confirmDelete.confirm")}
						compact
						loading={busy}
						onPress={onConfirm}
						style={ui.action}
					/>
				</View>
			}
		>
			{text.message ? <Copy>{text.message}</Copy> : null}
			{children}
			<InlineError message={state?.error} />
		</Dialog>
	)
}

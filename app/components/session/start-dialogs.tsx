import { useTranslation } from "react-i18next"

import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"

export type StartDialogState = {
	busy: boolean
	takeoverOpen: boolean
	failed: boolean
	confirmTakeover(): void
	retry(): void
	dismiss(): void
}

interface Props {
	state: StartDialogState
}

export function StartDialogs({ state }: Props) {
	const { t } = useTranslation()

	return (
		<>
			<ConfirmDialog
				visible={state.takeoverOpen}
				title={t("session.takeover.title")}
				message={t("session.takeover.message")}
				confirmLabel={t("session.takeover.confirm")}
				cancelLabel={t("common.cancel")}
				busy={state.busy}
				onConfirm={state.confirmTakeover}
				onClose={state.dismiss}
			/>
			<ConfirmDialog
				visible={state.failed}
				title={t("session.startError.title")}
				message={t("session.startError.message")}
				confirmLabel={t("common.retry")}
				cancelLabel={t("common.close")}
				busy={state.busy}
				onConfirm={state.retry}
				onClose={state.dismiss}
			/>
		</>
	)
}

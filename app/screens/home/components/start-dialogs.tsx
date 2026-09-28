import { useTranslation } from "react-i18next"

import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"

export type StartDialogState = {
	busy: boolean
	takeoverOpen: boolean
	startFailed: boolean
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
				text={{
					title: t("session.takeover.title"),
					message: t("session.takeover.message"),
					confirm: t("session.takeover.confirm"),
				}}
				state={{ busy: state.busy }}
				onConfirm={state.confirmTakeover}
				onClose={state.dismiss}
			/>
			<ConfirmDialog
				visible={state.startFailed}
				text={{
					title: t("session.startError.title"),
					message: t("session.startError.message"),
					confirm: t("common.retry"),
					cancel: t("common.close"),
				}}
				state={{ busy: state.busy }}
				onConfirm={state.retry}
				onClose={state.dismiss}
			/>
		</>
	)
}

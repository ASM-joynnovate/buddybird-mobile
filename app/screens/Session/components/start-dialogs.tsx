import { useTranslation } from "react-i18next"

import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import type { StartSessionState } from "@/screens/Session/hooks/use-start-session"

export function TakeoverDialog({
	visible,
	busy,
	onConfirm,
	onClose,
}: {
	visible: boolean
	busy?: boolean
	onConfirm(): void
	onClose(): void
}) {
	const { t } = useTranslation()

	return (
		<ConfirmDialog
			visible={visible}
			title={t("session.takeover.title")}
			message={t("session.takeover.message")}
			confirmLabel={t("session.takeover.confirm")}
			cancelLabel={t("common.cancel")}
			busy={busy}
			onConfirm={onConfirm}
			onClose={onClose}
		/>
	)
}

export function StartDialogs({ state }: { state: StartSessionState }) {
	const { t } = useTranslation()

	return (
		<>
			<TakeoverDialog
				visible={state.takeoverOpen}
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

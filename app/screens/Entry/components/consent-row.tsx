import { useTranslation } from "react-i18next"

import type { Consent } from "@/apis/consents"
import { IconButton } from "@/components/ui/icon-button"
import { CheckRow } from "@/components/ui/rows"
import { colors } from "@/theme"

export function ConsentRow({
	consent,
	checked,
	first,
	disabled,
	onToggle,
	onOpen,
}: {
	consent: Consent
	checked: boolean
	first?: boolean
	disabled?: boolean
	onToggle(): void
	onOpen(): void
}) {
	const { t } = useTranslation()

	return (
		<CheckRow
			first={first}
			label={consent.title}
			caption={t(consent.is_required ? "entry.consent.required" : "entry.consent.optional")}
			captionTone={consent.is_required ? "primary" : "muted"}
			checked={checked}
			disabled={disabled}
			onToggle={onToggle}
			trailing=<IconButton
				icon="forward"
				iconSize={15}
				iconWeight="bold"
				color={colors.muted}
				label={t("entry.consent.viewFull", { title: consent.title })}
				onPress={onOpen}
			/>
		/>
	)
}

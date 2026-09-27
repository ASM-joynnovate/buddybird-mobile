import { ChevronRightIcon } from "lucide-react-native"
import { useTranslation } from "react-i18next"

import { IconButton } from "@/components/ui/icon-button"
import { CheckRow } from "@/components/ui/rows"
import type { Consent } from "@/types/apis/consents"

interface Props {
	consent: Consent
	checked: boolean
	first?: boolean
	disabled?: boolean
	actions: { toggle(): void; open(): void }
}

export function ConsentRow({ consent, checked, first, disabled, actions }: Props) {
	const { t } = useTranslation()

	return (
		<CheckRow
			first={first}
			label={consent.title}
			caption={t(consent.is_required ? "entry.consent.required" : "entry.consent.optional")}
			captionTone={consent.is_required ? "primary" : "muted"}
			checked={checked}
			disabled={disabled}
			onToggle={actions.toggle}
			trailing=<IconButton
				icon={ChevronRightIcon}
				variant="muted"
				size="tiny"
				label={t("entry.consent.viewFull", { title: consent.title })}
				onPress={actions.open}
			/>
		/>
	)
}

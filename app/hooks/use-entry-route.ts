import { useQuery } from "@tanstack/react-query"

import { consentsQueryOptions } from "@/hooks/apis/consents"
import { parrotsQueryOptions } from "@/hooks/apis/parrots"
import { hasLegacyUpload } from "@/services/migration/upload-legacy"
import { useAccountStore } from "@/stores/account"
import { useDeviceSettingsStore } from "@/stores/device-settings"

export type EntryRoute =
	| "loading"
	| "error"
	| "Login"
	| "Consent"
	| "LegacyUpload"
	| "ParrotEditor"
	| "UsageGuide"
	| "Main"

export function useEntryRoute(): { route: EntryRoute; parrotId?: string; retry(): void } {
	const consents = useQuery(consentsQueryOptions())
	const parrots = useQuery(parrotsQueryOptions())

	const loginPending = useAccountStore(
		(account) => account.isAnonymous && !account.loginScreenSeen,
	)
	const onboardingCompleted = useDeviceSettingsStore((state) => state.onboardingCompleted)
	const legacyUploadPending = useDeviceSettingsStore(
		(state) => state.legacyMigration.upload !== "finished",
	)

	function retry() {
		void consents.refetch()
		void parrots.refetch()
	}

	if (loginPending) {
		return { route: "Login", retry }
	}

	if (consents.isError || parrots.isError) {
		return { route: "error", retry }
	}

	if (!consents.data || !parrots.data) {
		return { route: "loading", retry }
	}

	if (consents.data.some((consent) => consent.is_required && consent.status !== "granted")) {
		return { route: "Consent", retry }
	}

	if (legacyUploadPending && hasLegacyUpload()) {
		return { route: "LegacyUpload", retry }
	}

	if (parrots.data.length === 0) {
		return { route: "ParrotEditor", retry }
	}

	return {
		route: onboardingCompleted ? "Main" : "UsageGuide",
		parrotId: parrots.data[0]?.id,
		retry,
	}
}

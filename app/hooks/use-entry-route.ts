import { useQuery } from "@tanstack/react-query"

import { consentsQueryOptions } from "@/hooks/apis/consents"
import { parrotsQueryOptions } from "@/hooks/apis/parrots"
import { useDeviceSettingsStore } from "@/stores/device-settings"

export type EntryRoute = "loading" | "error" | "Consent" | "ParrotEditor" | "UsageGuide" | "Main"

export function useEntryRoute(): { route: EntryRoute; parrotId?: string; retry(): void } {
	const consents = useQuery(consentsQueryOptions())
	const parrots = useQuery(parrotsQueryOptions())

	const guides = useDeviceSettingsStore((state) => state.guides)

	function retry() {
		void consents.refetch()
		void parrots.refetch()
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

	if (parrots.data.length === 0) {
		return { route: "ParrotEditor", retry }
	}

	return { route: guides.usage ? "Main" : "UsageGuide", parrotId: parrots.data[0]?.id, retry }
}

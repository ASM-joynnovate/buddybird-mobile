import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { invalidate } from "@/hooks/apis/invalidate"
import { apiKeys } from "@/hooks/apis/keys"
import { parrotsQueryOptions } from "@/hooks/apis/parrots"
import {
	acceptLegacyUpload,
	finishLegacyUpload,
	uploadLegacy,
} from "@/services/migration/upload-legacy"
import { reportError } from "@/services/telemetry/client"
import { useDeviceSettingsStore } from "@/stores/device-settings"

async function runLegacyUpload() {
	await uploadLegacy()
	await invalidate(apiKeys.parrots.all(), apiKeys.words.all())

	finishLegacyUpload()
}

export function useLegacyUpload(): {
	asking: boolean
	failed: boolean
	add(): void
	skip(): void
	retry(): void
} {
	const parrots = useQuery(parrotsQueryOptions())

	const upload = useDeviceSettingsStore((state) => state.legacyMigration.upload)

	const [failed, setFailed] = useState(false)
	const [attempt, setAttempt] = useState(0)

	const asking = upload === "pending" && (parrots.data?.length ?? 0) > 0
	const ready = parrots.data !== undefined && !asking

	useEffect(() => {
		if (!ready) {
			return
		}

		void runLegacyUpload().catch((error) => {
			reportError(error, "legacy_upload")

			setFailed(true)
		})
	}, [ready, attempt])

	return {
		asking,
		failed,
		add: acceptLegacyUpload,
		skip: finishLegacyUpload,
		retry: () => {
			setFailed(false)
			setAttempt((count) => count + 1)
		},
	}
}

import { File } from "expo-file-system"

import { inspect } from "@/services/media/inspect"
import { isMediaReferenced } from "@/services/media/references"
import { resolveRecordingUri } from "@/services/media/uri"
import { readData, updateData } from "@/services/storage/data-store"
import { reportError } from "@/services/telemetry/client"

export async function drainFileDeletes() {
	for (const uri of readData().pendingFileDeletes) {
		const resolved = resolveRecordingUri(uri)

		if (isMediaReferenced(readData(), uri, resolveRecordingUri)) {
			continue
		}

		try {
			const info = await inspect(uri)

			if (isMediaReferenced(readData(), uri, resolveRecordingUri)) {
				continue
			}

			if (info.exists) {
				new File(resolved).delete()
			}

			updateData((next) => {
				next.pendingFileDeletes = next.pendingFileDeletes.filter((value) => value !== uri)
			})
		} catch (error) {
			reportError(error, "file_cleanup")
		}
	}
}

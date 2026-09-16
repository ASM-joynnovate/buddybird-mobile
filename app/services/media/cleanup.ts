import { File } from "expo-file-system"

import { inspect } from "@/services/media/inspect"
import { isMediaReferenced } from "@/services/media/references"
import { resolveRecordingUri } from "@/services/media/uri"
import { isMigrationMediaReferenced, readMigrationSource } from "@/services/migration/source"
import { readData, storage, updateData } from "@/services/storage/data-store"
import { reportError } from "@/services/telemetry/client"

export async function drainFileDeletes() {
	function referenced(uri: string) {
		const source = readMigrationSource(storage)

		return (
			!source ||
			isMigrationMediaReferenced(source, uri, resolveRecordingUri) ||
			isMediaReferenced(readData(), uri, resolveRecordingUri)
		)
	}

	for (const uri of readData().pendingFileDeletes) {
		try {
			const resolved = resolveRecordingUri(uri)

			if (referenced(uri)) {
				continue
			}

			const info = await inspect(uri)

			if (referenced(uri)) {
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

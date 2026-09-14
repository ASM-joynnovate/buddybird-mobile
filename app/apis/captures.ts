import { Directory, File, Paths } from "expo-file-system"

import { captureMetadata } from "@/apis/collection/metadata"
import { deviceForm, permitted, post } from "@/apis/collection/request"
import { installedVersion } from "@/lib/application"
import { writeCaptureZip } from "@/lib/zip"
import { resolveRecordingUri } from "@/services/media/uri"
import { reportError } from "@/services/telemetry/client"
import type { Capture } from "@/types/capture"
import type { CaptureBatchResult } from "@/types/uploads"

async function* chunks(file: File, signal?: AbortSignal) {
	const handle = file.open()

	try {
		while (true) {
			permitted(signal)
			const chunk = handle.readBytes(64 * 1024)

			if (!chunk.length) {
				break
			}

			yield chunk
			await new Promise<void>((resolve) => setTimeout(resolve, 0))
		}
	} finally {
		handle.close()
	}
}

export async function sendCaptureBatch(
	captures: Capture[],
	uid: string,
	signal?: AbortSignal,
): Promise<CaptureBatchResult> {
	const directory = new Directory(Paths.cache, "capture-upload")

	directory.create({ intermediates: true, idempotent: true })

	function cleanup() {
		for (const leftover of directory.list()) {
			if (/^(captures[.]zip|[0-9]+[.]wav)$/.test(leftover.name)) {
				leftover.delete()
			}
		}
	}

	// A single capture worker owns these temporary copies, including after restart.
	cleanup()
	const staged: { capture: Capture; file: File }[] = []
	const omittedIds: string[] = []

	try {
		for (const [index, capture] of captures.entries()) {
			permitted(signal)

			try {
				const source = new File(resolveRecordingUri(capture.uri))
				const size = source.size
				const file = new File(directory, index + ".wav")

				if (!source.exists || size < 44) {
					throw new Error("Capture unavailable: " + capture.id)
				}

				source.copy(file)

				if (!file.exists || file.size !== size) {
					throw new Error("Capture copy is incomplete: " + capture.id)
				}

				staged.push({ capture, file })
			} catch (error) {
				omittedIds.push(capture.id)
				reportError(error, "capture_read")
			}
		}

		const includedIds = staged.map(({ capture }) => capture.id)

		if (!staged.length) {
			return { response: null, includedIds, omittedIds }
		}

		const archive = new File(directory, "captures.zip")

		archive.create()
		const handle = archive.open()

		try {
			await writeCaptureZip(
				staged.map(({ capture, file }) => ({
					name: capture.fileName,
					chunks: chunks(file, signal),
				})),
				(chunk) => handle.writeBytes(chunk),
				signal,
			)
		} finally {
			handle.close()
		}

		const form = deviceForm(uid)

		form.append(
			"metadata",
			JSON.stringify(staged.map(({ capture }) => captureMetadata(capture, installedVersion))),
		)
		form.append("file", {
			uri: archive.uri,
			name: "captures.zip",
			type: "application/zip",
		} as unknown as Blob)

		return {
			response: await post("/api/v1/captures", form, 60_000, signal),
			includedIds,
			omittedIds,
		}
	} finally {
		try {
			cleanup()
		} catch (error) {
			reportError(error, "capture_upload_cleanup")
		}
	}
}

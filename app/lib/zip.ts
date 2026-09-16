import { Zip, ZipDeflate } from "fflate"

/** Stream source and compressed bytes; retain only one small chunk in JS memory. */
export async function writeCaptureZip(
	entries: { name: string; chunks: AsyncIterable<Uint8Array> }[],
	write: (chunk: Uint8Array) => void,
	signal?: AbortSignal,
) {
	let failure: Error | null = null
	let finished = false
	const zip = new Zip((error, chunk, final) => {
		if (error) {
			failure = error

			return
		}

		try {
			write(chunk)
		} catch (cause) {
			failure = cause instanceof Error ? cause : new Error("ZIP write failed")
		}

		finished = final
	})

	try {
		const names = new Set<string>()

		for (const entry of entries) {
			if (!entry.name || /[\\/]/.test(entry.name) || names.has(entry.name)) {
				throw new Error("Invalid or duplicate ZIP entry name")
			}

			names.add(entry.name)
			const file = new ZipDeflate(entry.name, { level: 2 })

			zip.add(file)

			for await (const chunk of entry.chunks) {
				if (signal?.aborted) {
					throw new Error("Upload cancelled")
				}

				file.push(chunk)

				if (failure) {
					throw failure
				}
			}

			file.push(new Uint8Array(), true)

			if (failure) {
				throw failure
			}
		}

		zip.end()

		if (failure) {
			throw failure
		}

		if (!finished) {
			throw new Error("ZIP did not finish")
		}
	} finally {
		zip.terminate()
	}
}

/** Resolve saved media after iOS replaces an application's container directory. */
export function mediaUri(uri: string, documents: string, cache?: string): string {
	const documentRoot = documents.endsWith("/") ? documents : `${documents}/`

	function resolveDocumentPath(directory: string, relativePath: string): string {
		const decodedPath = decodeURIComponent(relativePath)
		const containsTraversal = decodedPath
			.split("/")
			.some((part) => part === ".." || part === ".")
		const isInvalidPath =
			!decodedPath ||
			decodedPath.startsWith("/") ||
			containsTraversal ||
			decodedPath.includes("\\") ||
			decodedPath.includes("\0")

		if (isInvalidPath) {
			throw new Error("Invalid media path")
		}

		return documentRoot + directory + relativePath
	}

	if (uri.startsWith("recording://")) {
		const recordingPath = uri.slice("recording://".length)

		return resolveDocumentPath("recordings/", recordingPath)
	}

	if (uri.startsWith("photo://")) {
		// Photo references store the actual filename, including literal percent signs.
		const fileName = uri.slice("photo://".length)

		return resolveDocumentPath("photos/", encodeURIComponent(fileName))
	}

	if (!uri.startsWith("file://")) {
		return uri
	}

	const recordingPathIndex = uri.indexOf("/recordings/")

	if (recordingPathIndex >= 0) {
		const recordingPath = uri.slice(recordingPathIndex + "/recordings/".length)

		return resolveDocumentPath("recordings/", recordingPath)
	}

	const documentPathIndex = uri.indexOf("/Documents/")

	if (documentPathIndex >= 0) {
		const documentPath = uri.slice(documentPathIndex + "/Documents/".length)

		return resolveDocumentPath("", documentPath)
	}

	const cachePathIndex = uri.indexOf("/Library/Caches/")

	if (cache && cachePathIndex >= 0) {
		const cacheRoot = cache.endsWith("/") ? cache : `${cache}/`
		const cachedPath = uri.slice(cachePathIndex + "/Library/Caches/".length)

		return cacheRoot + cachedPath
	}

	return uri
}

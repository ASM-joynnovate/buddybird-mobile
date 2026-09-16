import { Paths } from "expo-file-system"

import { mediaUri } from "@/utils/media-uri"

export function resolveRecordingUri(uri: string) {
	return mediaUri(uri, Paths.document.uri, Paths.cache.uri)
}

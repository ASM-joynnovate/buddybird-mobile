import type { AppData } from "@/types/app-data"

export function isMediaReferenced(data: AppData, uri: string, resolve: (uri: string) => string) {
	const target = resolve(uri)
	const references = [
		data.profile?.photoUri,
		...Object.values(data.words)
			.filter((word) => !word.archived)
			.flatMap((word) => [word.audioUri, word.transformedAudioUri]),
		...Object.values(data.history).flatMap((session) => [
			session.word.audioUri,
			session.word.transformedAudioUri,
		]),
		...Object.values(data.sessionDrafts).flatMap((session) => [
			session.word.audioUri,
			session.word.transformedAudioUri,
		]),
		...Object.values(data.captures).map((capture) => capture.uri),
	]

	return references.some((reference) => reference && resolve(reference) === target)
}

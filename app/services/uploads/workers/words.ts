import { UploadDependencies } from "@/types/uploads"

export function createWordWorker(
	dependencies: UploadDependencies,
	canUpload: (signal?: AbortSignal) => boolean,
) {
	let wordUploadTask: Promise<void> | null = null
	let wordTriggerCount = 0
	const requestedIds = new Set<string>()

	function triggerWords(all = false, wordId?: string, signal?: AbortSignal) {
		let wordIdsToQueue: string[] = []

		dependencies.update((data) => {
			if (all) {
				wordIdsToQueue = Object.values(data.words)
					.filter((word) => word.sourceType === "recording" && !word.archived)
					.map((word) => word.id)
			} else if (wordId) {
				wordIdsToQueue = [wordId]
			}

			data.pendingWords = [...new Set([...data.pendingWords, ...wordIdsToQueue])]
		})
		wordIdsToQueue.forEach((id) => requestedIds.add(id))
		wordTriggerCount++

		if (wordUploadTask) {
			return wordUploadTask
		}

		wordUploadTask = (async () => {
			const skipped = new Set<string>()

			do {
				const observedTriggerCount = wordTriggerCount

				try {
					const data = dependencies.read()
					const pendingWordIds = [...requestedIds].sort((a, b) =>
						(data.words[a]?.createdAt ?? "").localeCompare(
							data.words[b]?.createdAt ?? "",
						),
					)

					requestedIds.clear()

					for (const id of pendingWordIds) {
						if (skipped.has(id)) {
							continue
						}

						if (!canUpload(signal)) {
							break
						}

						const word = dependencies.read().words[id]

						if (word?.sourceType === "recording" && !word.archived) {
							let fileInfo: { exists: boolean; size: number }

							try {
								fileInfo = await dependencies.inspect(word.audioUri)
							} catch (error) {
								skipped.add(id)
								dependencies.error(error)
								continue
							}

							if (!fileInfo.exists) {
								skipped.add(id)
								continue
							}

							const response = await dependencies.sendWord(
								word,
								dependencies.identity()!,
								signal,
							)

							if (response.status >= 400 && response.status < 500) {
								dependencies.rejectedWord(word, response)
							} else if (response.status < 200 || response.status >= 300) {
								break
							}
						}

						dependencies.update((next) => {
							const current = next.words[id]

							if (
								current?.updatedAt === word?.updatedAt &&
								current?.audioUri === word?.audioUri
							) {
								next.pendingWords = next.pendingWords.filter(
									(value) => value !== id,
								)
							}
						})
					}
				} catch (error) {
					dependencies.error(error)
				}

				if (wordTriggerCount === observedTriggerCount || signal?.aborted) {
					break
				}
			} while (true)
		})().finally(() => {
			wordUploadTask = null
		})

		return wordUploadTask
	}

	return { trigger: triggerWords, isUploading: () => wordUploadTask !== null }
}

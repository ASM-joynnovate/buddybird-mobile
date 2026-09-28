import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"

import { UPLOAD_POLL_INTERVAL_MS, UPLOAD_POLL_MAX_INTERVAL_MS } from "@/config"
import { invalidate } from "@/hooks/apis/invalidate"
import { apiKeys } from "@/hooks/apis/keys"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import {
	addRecordingMutationOptions,
	createWordMutationOptions,
	deleteRecordingMutationOptions,
	renameWordMutationOptions,
	wordQueryOptions,
} from "@/hooks/apis/words"
import { measureRecordingDuration } from "@/services/media/recording-duration"
import { reportError, track } from "@/services/telemetry/client"
import type { Recording, Word } from "@/types/apis/words"
import type { RecordedSample } from "@/types/navigation"

type SaveStep = "saving" | "uploading" | "processing"

export type DraftItem = {
	kind: "server" | "local"
	id: string
	url: string
	durationMs: number | null
}

export type WordDraft = {
	wordId: string | null
	loading: boolean
	loadFailed: boolean
	reload(): void
	name: string
	setName(value: string): void
	nameMissing: boolean
	items: DraftItem[]
	serverCount: number
	savedRecordingCount: number
	removeItem(item: DraftItem): void
	step: SaveStep | null
	saveFailed: boolean
	missingRecording: boolean
	save(onDone: () => void): Promise<void>
}

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

const serverItem = (recording: Recording, durationMs: number | null): DraftItem => ({
	kind: "server",
	id: recording.id,
	url: recording.url,
	durationMs,
})

export function useWordDraft(
	routeWordId: string | null,
	recorded: RecordedSample | undefined,
): WordDraft {
	const queryClient = useQueryClient()

	const create = useIdempotentMutation(createWordMutationOptions())
	const rename = useIdempotentMutation(renameWordMutationOptions())
	const upload = useMutation(addRecordingMutationOptions())
	const remove = useIdempotentMutation(deleteRecordingMutationOptions())

	const [createdId, setCreatedId] = useState<string | null>(null)
	const [nameInput, setNameInput] = useState<string | null>(null)
	const [locals, setLocals] = useState<readonly RecordedSample[]>([])
	const [removedIds, setRemovedIds] = useState<readonly string[]>([])
	const [step, setStep] = useState<SaveStep | null>(null)
	const [saveFailed, setSaveFailed] = useState(false)
	const [touched, setTouched] = useState(false)

	const alive = useRef(true)
	const consumed = useRef(new Set<string>())

	const wordId = routeWordId ?? createdId

	const word = useQuery({ ...wordQueryOptions(wordId ?? ""), enabled: Boolean(wordId) })
	const durations = useQueries({
		queries: (word.data?.recordings ?? []).map((recording) => ({
			queryKey: apiKeys.recordings.duration(recording.id),
			queryFn: () =>
				measureRecordingDuration(recording.url).catch((error: unknown) => {
					reportError(error, "recording_duration")

					throw error
				}),
			staleTime: Infinity,
		})),
	})

	const name = nameInput ?? word.data?.name ?? ""
	const servers = (word.data?.recordings ?? [])
		.map((recording, index) => serverItem(recording, durations[index]?.data ?? null))
		.filter((item) => !removedIds.includes(item.id))
	const items: DraftItem[] = [
		...servers,
		...locals.map((sample): DraftItem => ({
			kind: "local",
			id: sample.key,
			url: sample.uri,
			durationMs: sample.durationMs,
		})),
	]
	const nameMissing = touched && !name.trim()
	const missingRecording = touched && items.length === 0

	useEffect(() => {
		alive.current = true

		return () => {
			alive.current = false
		}
	}, [])

	useEffect(() => {
		if (routeWordId) {
			track("word_edit_started", { word_id: routeWordId })
		} else {
			track("word_create_started", {})
		}
	}, [routeWordId])

	useEffect(() => {
		if (!recorded || consumed.current.has(recorded.key)) {
			return
		}

		consumed.current.add(recorded.key)

		setLocals((current) => [...current, recorded])

		track("recording_finished", { duration_ms: recorded.durationMs })
	}, [recorded])

	function removeItem(item: DraftItem) {
		if (item.kind === "local") {
			setLocals((current) => current.filter((sample) => sample.key !== item.id))
		} else {
			setRemovedIds((current) => [...current, item.id])
		}
	}

	async function waitForRecordings(id: string, expectedCount: number): Promise<Word | null> {
		let intervalMs = UPLOAD_POLL_INTERVAL_MS

		while (alive.current) {
			const latest = await queryClient.query({ ...wordQueryOptions(id), staleTime: 0 })

			if (latest.recordings.length >= expectedCount) {
				return latest
			}

			await wait(intervalMs)

			intervalMs = Math.min(intervalMs * 2, UPLOAD_POLL_MAX_INTERVAL_MS)
		}

		return null
	}

	async function persistName(): Promise<string> {
		const trimmed = name.trim()

		if (!wordId) {
			const created = await create.mutateAsync({ name: trimmed })

			setCreatedId(created.id)

			return created.id
		}

		if (trimmed !== word.data?.name) {
			await rename.mutateAsync({ id: wordId, name: trimmed })

			setNameInput(trimmed)
		}

		return wordId
	}

	async function save(onDone: () => void) {
		setTouched(true)

		if (step || !name.trim() || items.length === 0) {
			return
		}

		setSaveFailed(false)

		const expectedCount = (word.data?.recordings.length ?? 0) + locals.length
		const addedCount = locals.length
		const renamed = name.trim() !== word.data?.name

		try {
			setStep("saving")

			const id = await persistName()

			setStep("uploading")

			for (const sample of locals) {
				await upload.mutateAsync({
					wordId: id,
					uri: sample.uri,
					idempotencyKey: sample.key,
				})

				setLocals((current) => current.filter((item) => item.key !== sample.key))
			}

			setStep("processing")

			const latest = await waitForRecordings(id, expectedCount)

			if (!latest) {
				return
			}

			setStep("saving")

			const pending = removedIds.filter((recordingId) =>
				latest.recordings.some((recording) => recording.id === recordingId),
			)

			for (const recordingId of pending) {
				await remove.mutateAsync({ wordId: id, recordingId })
			}

			await invalidate(apiKeys.words.all())

			const recordingCount = latest.recordings.length - pending.length

			if (routeWordId) {
				track("word_updated", {
					word_id: id,
					recording_count: recordingCount,
					added_count: addedCount,
					removed_count: pending.length,
					renamed,
				})
			} else {
				track("word_created", { word_id: id, recording_count: recordingCount })
			}

			if (alive.current) {
				onDone()
			}
		} catch {
			if (alive.current) {
				setSaveFailed(true)

				void word.refetch()
			}
		} finally {
			if (alive.current) {
				setStep(null)
			}
		}
	}

	return {
		wordId,
		loading: Boolean(routeWordId) && word.isPending,
		loadFailed: Boolean(routeWordId) && word.isError,
		reload: () => void word.refetch(),
		name,
		setName: setNameInput,
		nameMissing,
		items,
		serverCount: servers.length,
		savedRecordingCount: word.data?.recordings.length ?? 0,
		removeItem,
		step,
		saveFailed,
		missingRecording,
		save,
	}
}

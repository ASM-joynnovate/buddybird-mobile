import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import { useEffect, useRef, useState } from "react"

import type { Recording, Word } from "@/apis/words"
import {
	addRecordingMutationOptions,
	createWordMutationOptions,
	deleteRecordingMutationOptions,
	refreshWords,
	renameWordMutationOptions,
	wordQueryOptions,
} from "@/hooks/apis/words"
import type { RecordedSample } from "@/types/navigation"

export const MAX_RECORDINGS = 5
export const RECOMMENDED_RECORDINGS = 3
export const NAME_MAX = 50
const POLL_MS = 1000

export type SaveStep = "saving" | "uploading" | "processing"

export type DraftItem = { kind: "server" | "local"; id: string; url: string; durationMs: number }

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

const serverItem = (recording: Recording): DraftItem => ({
	kind: "server",
	id: recording.id,
	url: recording.url,
	durationMs: recording.duration_ms,
})

export function useWordDraft(
	routeWordId: string | null,
	recorded: RecordedSample | undefined,
): WordDraft {
	const queryClient = useQueryClient()
	const [createdId, setCreatedId] = useState<string | null>(null)
	const wordId = routeWordId ?? createdId
	const word = useQuery({ ...wordQueryOptions(wordId ?? ""), enabled: Boolean(wordId) })
	const [nameInput, setNameInput] = useState<string | null>(null)
	const [locals, setLocals] = useState<readonly RecordedSample[]>([])
	const [removedIds, setRemovedIds] = useState<readonly string[]>([])
	const [step, setStep] = useState<SaveStep | null>(null)
	const [saveFailed, setSaveFailed] = useState(false)
	const [touched, setTouched] = useState(false)
	const alive = useRef(true)
	const consumed = useRef(new Set<string>())
	const create = useMutation(createWordMutationOptions())
	const rename = useMutation(renameWordMutationOptions())
	const upload = useMutation(addRecordingMutationOptions())
	const remove = useMutation(deleteRecordingMutationOptions())

	useEffect(() => {
		alive.current = true

		return () => {
			alive.current = false
		}
	}, [])

	useEffect(() => {
		if (!recorded || consumed.current.has(recorded.key)) {
			return
		}

		consumed.current.add(recorded.key)
		setLocals((current) => [...current, recorded])
	}, [recorded])

	const name = nameInput ?? word.data?.name ?? ""
	const servers = (word.data?.recordings ?? [])
		.filter((recording) => !removedIds.includes(recording.id))
		.map(serverItem)
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

	function removeItem(item: DraftItem) {
		if (item.kind === "local") {
			setLocals((current) => current.filter((sample) => sample.key !== item.id))
		} else {
			setRemovedIds((current) => [...current, item.id])
		}
	}

	async function waitUntilReady(id: string): Promise<Word | null> {
		while (alive.current) {
			const latest = await queryClient.query({ ...wordQueryOptions(id), staleTime: 0 })

			if (latest.recordings.every((recording) => recording.status === "ready")) {
				return latest
			}

			await wait(POLL_MS)
		}

		return null
	}

	async function persistName(): Promise<string> {
		const trimmed = name.trim()

		if (!wordId) {
			const created = await create.mutateAsync({
				name: trimmed,
				idempotencyKey: randomUUID(),
			})

			setCreatedId(created.id)

			return created.id
		}

		if (trimmed !== word.data?.name) {
			await rename.mutateAsync({ id: wordId, name: trimmed, idempotencyKey: randomUUID() })
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

		try {
			setStep("saving")
			const id = await persistName()

			setStep("uploading")

			for (const sample of locals) {
				await upload.mutateAsync({
					wordId: id,
					file: { uri: sample.uri, duration_ms: sample.durationMs },
					idempotencyKey: sample.key,
				})
				setLocals((current) => current.filter((item) => item.key !== sample.key))
			}

			setStep("processing")
			const latest = await waitUntilReady(id)

			if (!latest) {
				return
			}

			setStep("saving")

			const pending = removedIds.filter((recordingId) =>
				latest.recordings.some((recording) => recording.id === recordingId),
			)

			for (const recordingId of pending) {
				await remove.mutateAsync({ wordId: id, recordingId, idempotencyKey: randomUUID() })
			}

			await refreshWords()

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
		removeItem,
		step,
		saveFailed,
		missingRecording,
		save,
	}
}

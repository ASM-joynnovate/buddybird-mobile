import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"

import { UPLOAD_POLL_INTERVAL_MS } from "@/config"
import { invalidate } from "@/hooks/apis/invalidate"
import { apiKeys } from "@/hooks/apis/keys"
import { recordingStatusQueryOptions } from "@/hooks/apis/mocks"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import {
	addRecordingMutationOptions,
	createWordMutationOptions,
	deleteRecordingMutationOptions,
	renameWordMutationOptions,
	wordQueryOptions,
} from "@/hooks/apis/words"
import type { RecordingStatus } from "@/mocks/types"
import type { Recording } from "@/types/apis/words"
import type { RecordedSample } from "@/types/navigation"

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

const serverItem = (recording: Recording, statuses: readonly RecordingStatus[]): DraftItem => ({
	kind: "server",
	id: recording.id,
	url: recording.url,
	durationMs: statuses.find((item) => item.recording_id === recording.id)?.duration_ms ?? 0,
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
	const recordingStatuses = useQuery({
		...recordingStatusQueryOptions(wordId ?? ""),
		enabled: Boolean(wordId),
	})

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
		.map((recording) => serverItem(recording, recordingStatuses.data ?? []))
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

	async function waitUntilReady(id: string): Promise<RecordingStatus[] | null> {
		while (alive.current) {
			const latest = await queryClient.query({
				...recordingStatusQueryOptions(id),
				staleTime: 0,
			})

			if (latest.every((recording) => recording.status === "ready")) {
				return latest
			}

			await wait(UPLOAD_POLL_INTERVAL_MS)
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

		try {
			setStep("saving")

			const id = await persistName()

			setStep("uploading")

			for (const sample of locals) {
				await upload.mutateAsync({
					wordId: id,
					file: { uri: sample.uri, durationMs: sample.durationMs },
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
				latest.some((recording) => recording.recording_id === recordingId),
			)

			for (const recordingId of pending) {
				await remove.mutateAsync({ wordId: id, recordingId })
			}

			await invalidate(apiKeys.words.all())

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

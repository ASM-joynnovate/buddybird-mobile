import { isMediaReferenced } from "@/services/media/references"
import { creditRecovery, recoveryDraft } from "@/services/session/history"
import type { AppData } from "@/types/app-data"
import type { Capture } from "@/types/capture"
import type { SessionDraft } from "@/types/session"
import type {
	CaptureChanges,
	CapturedSegment,
	EvictedCapture,
	PendingRecovery,
	SessionAudioEngineModule,
} from "@modules/session-audio-engine"

type TransferStore = {
	read(): AppData
	update(change: (data: AppData) => void): AppData
	inspect(uri: string): Promise<{ exists: boolean; size: number }>
	resolve(uri: string): string
	error(error: unknown): void
	captureSaved?(capture: Capture, pendingCount: number): void
	captureEvicted?(eviction: EvictedCapture, capture?: Capture): void
	finalized?(recovery: PendingRecovery, draft: SessionDraft): void
}
type NativeTransfer = Pick<
	SessionAudioEngineModule,
	| "getSnapshot"
	| "getPendingRecovery"
	| "getCaptureChanges"
	| "ackCaptureChanges"
	| "clearPendingRecovery"
>

function sessionMigrationPending(data: AppData, sessionId: string) {
	return data.migration.issues.some(
		({ key }) =>
			[
				"training",
				"history",
				"sessionDrafts",
				`history/${sessionId}`,
				`sessionDrafts/${sessionId}`,
			].includes(key) ||
			(key === "profile" && !data.sessionDrafts[sessionId]),
	)
}

function captureDraft(
	data: AppData,
	segment: CapturedSegment,
	recovery: PendingRecovery | null,
): SessionDraft | undefined {
	const saved = data.sessionDrafts[segment.sessionId]

	if (saved) {
		return saved
	}

	if (recovery?.sessionId === segment.sessionId) {
		return recoveryDraft(data, recovery)
	}

	const history = data.history[segment.sessionId]

	if (!history) {
		return undefined
	}

	return {
		id: history.id,
		settings: history,
		word: history.word,
		startedAt: history.startedAt,
		clientWordId: history.word.presetKey
			? "preset-" + history.word.presetKey
			: (history.libraryEntryId ?? history.wordId),
		parrotSpecies: data.profile?.species ?? null,
		parrotBirthdate: data.profile?.birthDate ?? null,
	}
}

function creditCapture(data: AppData, draft: SessionDraft) {
	data.sessionDrafts[draft.id] = {
		...draft,
		captureCount: (draft.captureCount ?? 0) + 1,
	}
}

/** Save and verify changes before acknowledging native captures or eviction receipts. */
export async function transferNativeState(native: NativeTransfer, store: TransferStore) {
	const initialSnapshot = await native.getSnapshot()
	const initialRecovery = await native.getPendingRecovery()
	const initialChanges = await native.getCaptureChanges()
	const skipped = new Set<string>()
	const receipts = store.read().nativeCaptureReceipts

	if (receipts.length) {
		// An upload may already have removed a file after JS saved it but before native ACK.
		await native.ackCaptureChanges(
			receipts.filter((id) => !id.startsWith("evicted:")),
			receipts.filter((id) => id.startsWith("evicted:")).map((id) => id.slice(8)),
		)
		store.update((data) => {
			data.nativeCaptureReceipts = []
		})
	}

	async function persistAndAcknowledge(
		changes: CaptureChanges,
		recovery: PendingRecovery | null,
	) {
		const capturedIds = new Set<string>()
		const evictedNames = new Set<string>()

		function evict(eviction: EvictedCapture) {
			const data = store.read()
			const receipt = "evicted:" + eviction.fileName
			const capture =
				data.captures[eviction.segmentId] ??
				Object.values(data.captures).find((item) => item.fileName === eviction.fileName)

			if (!data.nativeCaptureReceipts.includes(receipt) && !receipts.includes(receipt)) {
				const segment = eviction.capture
				const draft =
					segment && !capture && !data.nativeCaptureReceipts.includes(segment.segmentId)
						? captureDraft(data, segment, recovery)
						: undefined

				store.update((next) => {
					if (capture) {
						delete next.captures[capture.id]
					}

					if (draft && segment) {
						creditCapture(next, draft)
					}

					next.nativeCaptureReceipts.push(receipt)
				})

				if (capture || segment) {
					store.captureEvicted?.(eviction, capture)
				}
			}

			evictedNames.add(eviction.fileName)
		}

		for (const eviction of changes.evicted) {
			if (
				eviction.capture &&
				sessionMigrationPending(store.read(), eviction.capture.sessionId)
			) {
				continue
			}

			evict(eviction)
		}

		for (const segment of changes.captures) {
			if (evictedNames.has(segment.fileName) || receipts.includes(segment.segmentId)) {
				continue
			}

			const data = store.read()

			if (sessionMigrationPending(data, segment.sessionId)) {
				continue
			}

			if (
				data.nativeCaptureReceipts.includes(segment.segmentId) ||
				data.captures[segment.segmentId]
			) {
				if (!data.nativeCaptureReceipts.includes(segment.segmentId)) {
					store.update((next) => {
						next.nativeCaptureReceipts.push(segment.segmentId)
					})
				}

				capturedIds.add(segment.segmentId)
				continue
			}

			if (skipped.has(segment.segmentId) || segment.fileStatus === "unreadable") {
				skipped.add(segment.segmentId)
				continue
			}

			const draft = captureDraft(data, segment, recovery)
			const uri = "recording://session-captures/" + segment.fileName
			let info: { exists: boolean; size: number }

			try {
				info = await store.inspect(segment.uri)

				if (info.exists && (!Number.isFinite(info.size) || info.size < 44)) {
					throw new Error("Pending native recording unavailable")
				}
			} catch (error) {
				skipped.add(segment.segmentId)
				store.error(error)
				continue
			}

			if (!draft || !info.exists) {
				if (
					!draft &&
					info.exists &&
					((initialSnapshot.sessionId === segment.sessionId &&
						["starting", "running", "paused", "interrupted", "stopping"].includes(
							initialSnapshot.state,
						)) ||
						!/^session-[A-Za-z0-9_-]{1,200}-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\.wav$/.test(
							segment.fileName,
						) ||
						isMediaReferenced(store.read(), uri, store.resolve))
				) {
					continue
				}

				store.update((next) => {
					if (info.exists && !next.pendingFileDeletes.includes(uri)) {
						next.pendingFileDeletes.push(uri)
					}

					next.nativeCaptureReceipts.push(segment.segmentId)
				})
				capturedIds.add(segment.segmentId)
				continue
			}

			const capture: Capture = {
				id: segment.segmentId,
				sessionId: segment.sessionId,
				wordId: draft.settings.wordId,
				clientWordId: draft.clientWordId,
				parrotSpecies: draft.parrotSpecies,
				parrotBirthdate: draft.parrotBirthdate,
				cycle: segment.cycle,
				phase: segment.phase,
				capturedAt: segment.capturedAt,
				uri: "recording://session-captures/" + segment.fileName,
				fileName: segment.fileName,
				segments: [
					{
						startMs: Math.min(segment.durationMs, Math.max(0, segment.speechStartMs)),
						endMs: Math.min(
							segment.durationMs,
							Math.max(segment.speechStartMs, segment.speechEndMs),
						),
					},
				],
				sizeBytes: info.size,
			}
			const saved = store.update((next) => {
				next.captures[capture.id] = capture
				next.nativeCaptureReceipts.push(capture.id)
				creditCapture(next, draft)
			})

			store.captureSaved?.(capture, Object.keys(saved.captures).length)
			capturedIds.add(segment.segmentId)
		}

		if (capturedIds.size || evictedNames.size) {
			await native.ackCaptureChanges([...capturedIds], [...evictedNames])
		}

		// Reconciliation is the sole writer. Remaining receipts belong to completed ACKs.
		if (store.read().nativeCaptureReceipts.length) {
			store.update((data) => {
				data.nativeCaptureReceipts = []
			})
		}
	}

	await persistAndAcknowledge(initialChanges, initialRecovery)

	for (const capture of Object.values(store.read().captures)) {
		if (skipped.has(capture.id)) {
			continue
		}

		let info: { exists: boolean; size: number }

		try {
			info = await store.inspect(capture.uri)
		} catch (error) {
			store.error(error)
			continue
		}

		if (!info.exists) {
			store.update((data) => {
				delete data.captures[capture.id]
			})
		}
	}

	const snapshot = await native.getSnapshot()

	if (["starting", "running", "paused", "interrupted", "stopping"].includes(snapshot.state)) {
		return
	}

	const finalRecovery = await native.getPendingRecovery()

	if (finalRecovery) {
		if (sessionMigrationPending(store.read(), finalRecovery.sessionId)) {
			throw new Error("Session recovery is waiting for its saved data to be imported")
		}

		await persistAndAcknowledge(await native.getCaptureChanges(), finalRecovery)
		const draft = recoveryDraft(store.read(), finalRecovery)

		store.update((data) => {
			creditRecovery(data, finalRecovery)
		})
		await native.clearPendingRecovery(finalRecovery.sessionId)
		store.finalized?.(finalRecovery, draft)
	}

	const pendingSessions = new Set(
		(await native.getCaptureChanges()).captures.map((capture) => capture.sessionId),
	)
	const data = store.read()
	const finishedDrafts = Object.values(data.sessionDrafts).filter(
		(draft) =>
			(draft.metricsCredited || data.history[draft.id]) && !pendingSessions.has(draft.id),
	)

	if (finishedDrafts.length) {
		store.update((next) => {
			for (const draft of finishedDrafts) {
				delete next.sessionDrafts[draft.id]
			}
		})
	}
}

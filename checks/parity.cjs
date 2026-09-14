// Run with: node checks/parity.cjs. Uses production modules with only native I/O replaced.
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")
const root = path.resolve(__dirname, "..")

function load(entry, overrides = {}) {
	const cache = new Map()
	function read(name) {
		if (Object.hasOwn(overrides, name)) return overrides[name]
		if (!name.startsWith("@/")) return require(name)
		const file = path.join(root, "app", name.slice(2) + ".ts")
		if (cache.has(file)) return cache.get(file).exports
		const module = { exports: {} }
		cache.set(file, module)
		const { outputText } = ts.transpileModule(fs.readFileSync(file, "utf8"), {
			compilerOptions: {
				module: ts.ModuleKind.CommonJS,
				target: ts.ScriptTarget.ES2022,
				esModuleInterop: true,
			},
		})
		new Function("require", "module", "exports", outputText)(read, module, module.exports)
		return module.exports
	}
	return read(entry)
}
const { emptyData } = load("@/services/storage/empty-data")
const { transferNativeState } = load("@/services/session/transfer")
const settings = {
	wordId: "old",
	libraryEntryId: "word",
	sourceType: "recording",
	totalDurationSeconds: 90,
	learningDurationSeconds: 30,
	restDurationSeconds: 15,
	stressCareDurationSeconds: 0,
}
const draft = {
	id: "session",
	settings,
	startedAt: "2026-09-01T00:00:00Z",
	word: { label: "안녕", sourceType: "recording", audioUri: "recording://word.wav" },
	clientWordId: "word",
	parrotSpecies: null,
	parrotBirthdate: null,
}
const segment = {
	segmentId: "capture",
	sessionId: "session",
	uri: "file:///capture.wav",
	fileName: "capture.wav",
	phase: "learning",
	cycle: 1,
	capturedAt: draft.startedAt,
	durationMs: 1000,
	speechStartMs: 20,
	speechEndMs: 980,
}
function fixture() {
	let data = emptyData("ko")
	data.sessionDrafts.session = structuredClone(draft)
	let changes = { captures: [], evicted: [] }
	let recovery = null
	let running = true
	const calls = []
	const store = {
		read: () => data,
		update(change) {
			const next = structuredClone(data)
			change(next)
			data = next
			return data
		},
		fileSize: () => 2044,
	}
	const native = {
		getCaptureChanges: async () => structuredClone(changes),
		getPendingRecovery: async () => recovery,
		getSnapshot: async () => ({ state: running ? "running" : "completed" }),
		ackCaptureChanges: async (ids, names) => {
			calls.push(["ack", ids, names])
			changes.captures = changes.captures.filter((item) => !ids.includes(item.segmentId))
			changes.evicted = changes.evicted.filter((item) => !names.includes(item.fileName))
		},
		clearPendingRecovery: async () => {
			calls.push(["clear"])
			recovery = null
		},
	}
	return {
		store,
		native,
		calls,
		changes,
		finish(reason = "duration-reached") {
			running = false
			recovery = {
				sessionId: "session",
				reason,
				snapshot: {
					elapsedRunningMs: 90000,
					targetPlaybackCount: 4,
					savedAt: "2026-09-01T00:01:30Z",
				},
			}
		},
	}
}

async function main() {
	// Failed durable write never authorizes native deletion.
	const { writeVerified } = load("@/services/storage/verified-write")
	const failed = fixture()
	failed.changes.captures.push(segment)
	failed.store.update = () => writeVerified({ set() {}, getString: () => "old" }, "data", "new")
	await assert.rejects(transferNativeState(failed.native, failed.store), /verification/)
	assert.deepEqual(failed.calls, [])

	// Saved metadata survives ACK failure, even if an upload removes the file before retry.
	const retry = fixture()
	retry.changes.captures.push(segment)
	const ack = retry.native.ackCaptureChanges
	retry.native.ackCaptureChanges = async () => {
		throw Error("ACK failed")
	}
	await assert.rejects(transferNativeState(retry.native, retry.store), /ACK failed/)
	assert.equal(retry.store.read().sessionDrafts.session.captureCount, 1)
	retry.store.update((data) => {
		delete data.captures.capture
	})
	retry.store.fileSize = () => {
		throw Error("already uploaded")
	}
	retry.native.getCaptureChanges = async () => {
		assert.equal(
			retry.changes.captures.length,
			0,
			"receipt ACK must precede pending file inspection",
		)
		return structuredClone(retry.changes)
	}
	retry.native.ackCaptureChanges = ack
	await transferNativeState(retry.native, retry.store)
	assert.equal(retry.store.read().sessionDrafts.session.captureCount, 1)
	assert.deepEqual(retry.store.read().nativeCaptureReceipts, [])

	// A prune between snapshots is recoverable; an unexplained missing file is retained.
	const pruned = fixture()
	pruned.changes.captures.push(segment)
	const eviction = {
		capture: segment,
		segmentId: segment.segmentId,
		fileName: segment.fileName,
		sizeBytes: 2044,
		capturedAt: segment.capturedAt,
	}
	pruned.store.fileSize = () => {
		pruned.changes.evicted.push(eviction)
		pruned.changes.captures.length = 0
		throw Error("pruned")
	}
	await transferNativeState(pruned.native, pruned.store)
	assert.equal(pruned.store.read().sessionDrafts.session.captureCount, 1)
	assert.deepEqual(pruned.store.read().captures, {})
	assert.equal(pruned.changes.evicted.length, 0)
	const missing = fixture()
	missing.changes.captures.push(segment)
	missing.store.fileSize = () => {
		throw Error("missing")
	}
	await assert.rejects(transferNativeState(missing.native, missing.store), /missing/)
	assert.deepEqual(missing.calls, [])

	// Never-seen captures evicted in the background still count once across failed ACKs.
	const unseen = fixture()
	unseen.changes.evicted.push(eviction)
	const unseenAck = unseen.native.ackCaptureChanges
	unseen.native.ackCaptureChanges = async () => {
		throw Error("ACK failed")
	}
	await assert.rejects(transferNativeState(unseen.native, unseen.store))
	unseen.native.ackCaptureChanges = unseenAck
	await transferNativeState(unseen.native, unseen.store)
	assert.equal(unseen.store.read().sessionDrafts.session.captureCount, 1)

	// Canonical metrics merge once without rewriting historical IDs.
	const data = emptyData("ko")
	const metric = (count, date) => ({
		word_id: "old",
		word_name: "안녕",
		lifetime_practice_count: count,
		lifetime_practice_duration_ms: count * 1000,
		lifetime_recording_count: count,
		last_practiced_at_iso: date,
	})
	data.wordAliases = { old: "word" }
	data.settings.wordMetrics = {
		old: metric(2, "2026-09-01"),
		word: metric(3, "2026-08-01"),
		unknown: metric(7, null),
	}
	data.history.keep = { wordId: "old" }
	const { mergeAliasedMetrics } = load("@/services/migration/legacy/word-metrics")
	assert.equal(mergeAliasedMetrics(data), true)
	assert.equal(data.settings.wordMetrics.word.lifetime_practice_count, 5)
	assert.equal(data.settings.wordMetrics.word.last_practiced_at_iso, "2026-09-01")
	assert.equal(mergeAliasedMetrics(data), false)
	assert.equal(data.settings.wordMetrics.unknown.lifetime_practice_count, 7)
	assert.equal(data.history.keep.wordId, "old")

	// Read activated native cache before any fetch, including forced updates when offline.
	let initialized = false
	const remote = { latest_version: "2.0.0", min_supported_version: "1.5.0", release_notes: "{}" }
	const updates = load("@/apis/app-update", {
		"@react-native-firebase/remote-config": {
			getRemoteConfig: () => remote,
			ensureInitialized: async () => {
				initialized = true
			},
			getString: (_, key) => (initialized ? remote[key] : ""),
			fetchAndActivate: () => {
				throw Error("offline")
			},
		},
		"@/config": { config: { production: true } },
		"@/services/storage/data-store": {},
	})
	assert.equal(updates.readUpdatePolicy(), undefined)
	await updates.initializeUpdateCache()
	const { evaluateUpdate } = load("@/services/updates/policy")
	assert.equal(evaluateUpdate(updates.readUpdatePolicy(), "1.2.0", "2.0.0", "ko").forced, true)

	// Completion keeps reference-audio counts distinct from VAD and uses native replay totals.
	for (const reason of ["duration-reached", "user-stop"]) {
		const final = fixture()
		final.finish(reason)
		const events = []
		const session = load("@/services/session/session", {
			"expo-audio": {},
			"expo-crypto": {},
			"expo-file-system": {},
			"@/services/media/audio": {},
			"@/services/media/files": {},
			"@/services/media/uri": {},
			"@/services/storage/data-store": {
				readData: final.store.read,
				updateData: final.store.update,
			},
			"@/services/telemetry/client": { track: (...event) => events.push(event) },
			"@modules/session-audio-engine": { __esModule: true, default: final.native },
		})
		await session.recoverNativeData()
		const event = (name) => events.find(([key]) => key === name)?.[1]
		assert.equal(
			final.store.read().settings.wordMetrics.word.lifetime_practice_duration_ms,
			60000,
		)
		if (reason === "duration-reached") {
			assert.equal(event("word_practice_completed").recordings_count, 0)
			assert.equal(event("word_practice_completed").replay_count, 3)
			assert.equal(event("training_session_completed").total_recordings, 1)
			assert.equal(event("training_session_completed").avg_recording_duration_ms, 30000)
		} else {
			assert.equal(event("word_practice_completed"), undefined)
			assert.ok(event("training_session_abandoned"))
		}
	}

	// Broken head entries do not block a healthy upload or spin inside one flush.
	const upload = fixture()
	for (const id of ["inspect-bad", "copy-bad", "good"])
		upload.store.read().captures[id] = { ...segment, id, uri: id }
	let sends = 0
	const { createCaptureWorker } = load("@/services/uploads/workers/captures")
	const worker = createCaptureWorker(
		{
			...upload.store,
			cleanup: async () => {},
			identity: () => "uid",
			error() {},
			resolved() {},
			aborted() {
				assert.fail("healthy entries should still upload")
			},
			inspect: async (uri) => {
				if (uri === "inspect-bad") throw Error("unreadable")
				return { exists: true, size: 2044 }
			},
			sendCaptures: async (batch) => {
				assert.ok(++sends <= 2)
				return {
					includedIds: ["good"],
					omittedIds: ["copy-bad"],
					response: {
						status: 207,
						body: {
							data: {
								"good": { status: "success" },
								"copy-bad": { status: "success" },
							},
						},
					},
				}
			},
		},
		() => true,
	)
	await worker.trigger("foreground")
	assert.equal(sends, 1)
	assert.deepEqual(Object.keys(upload.store.read().captures), ["inspect-bad", "copy-bad"])

	// ZIP reads stable copies after native eviction, and metadata lists only staged files.
	const disk = new Map([
		["source/good", new Uint8Array(2044).fill(7)],
		["cache/capture-upload/keep.txt", new Uint8Array([1])],
	])
	class File {
		constructor(parent, name) {
			this.uri = name ? (parent.uri ?? parent) + "/" + name : parent
			this.name = this.uri.split("/").at(-1)
		}
		get exists() {
			return disk.has(this.uri)
		}
		get size() {
			return disk.get(this.uri)?.length ?? 0
		}
		create() {
			disk.set(this.uri, new Uint8Array())
		}
		delete() {
			disk.delete(this.uri)
		}
		copy(to) {
			disk.set(to.uri, disk.get(this.uri).slice())
			disk.delete(this.uri)
		}
		open() {
			let offset = 0
			return {
				readBytes: (size) => {
					const bytes = disk.get(this.uri).slice(offset, offset + size)
					offset += bytes.length
					return bytes
				},
				writeBytes: (bytes) =>
					disk.set(this.uri, Buffer.concat([disk.get(this.uri), bytes])),
				close() {},
			}
		}
	}
	class Directory {
		constructor(parent, name) {
			this.uri = parent + "/" + name
		}
		create() {}
		list() {
			return [...disk.keys()]
				.filter((uri) => uri.startsWith(this.uri + "/"))
				.map((uri) => new File(uri))
		}
	}
	const { unzipSync } = require("fflate")
	const { sendCaptureBatch } = load("@/apis/captures", {
		"expo-file-system": { File, Directory, Paths: { cache: "cache" } },
		"@/services/media/uri": { resolveRecordingUri: (uri) => uri },
		"@/lib/application": { installedVersion: "1.2.0" },
		"@/services/telemetry/client": { reportError() {} },
		"@/apis/collection/request": {
			permitted() {},
			deviceForm: () => {
				const fields = new Map()
				return {
					append: (key, value) => fields.set(key, value),
					get: (key) => fields.get(key),
				}
			},
			post: async (_, form) => {
				const metadata = JSON.parse(form.get("metadata"))
				assert.deepEqual(
					metadata.map((item) => item.client_capture_id),
					["good"],
				)
				const entries = unzipSync(disk.get(form.get("file").uri))
				assert.deepEqual(Object.keys(entries), ["good.wav"])
				assert.equal(entries["good.wav"].length, 2044)
				assert.equal(disk.has("source/good"), false)
				return { status: 200, body: {} }
			},
		},
	})
	const result = await sendCaptureBatch(
		["bad", "good"].map((id) => ({
			...segment,
			id,
			fileName: id + ".wav",
			uri: "source/" + id,
		})),
		"uid",
	)
	assert.deepEqual(result.includedIds, ["good"])
	assert.deepEqual(result.omittedIds, ["bad"])
	assert.deepEqual([...disk.keys()], ["cache/capture-upload/keep.txt"])

	// Pause/background time cannot become UI lag, and resume cannot reset the per-session quota.
	const events = []
	const { createPerformanceReporter } = load("@/services/telemetry/performance", {
		"@/services/telemetry/client": { track: (_, event) => events.push(event) },
	})
	const original = {
		now: Date.now,
		setInterval: global.setInterval,
		clearInterval: global.clearInterval,
	}
	let now = 0,
		tick
	try {
		Date.now = () => now
		global.setInterval = (callback) => {
			tick = callback
			return 1
		}
		global.clearInterval = () => {
			tick = undefined
		}
		const reporter = createPerformanceReporter("session", () => ({
			duringUpload: false,
			consentStatus: "granted",
		}))
		reporter.setRunning(true)
		now += 100
		tick()
		reporter.setRunning(false)
		now += 60000
		reporter.setRunning(true)
		now += 100
		tick()
		assert.equal(events.length, 0)
		for (let sequence = 1; sequence <= 22; sequence++) {
			now += 6000
			reporter.audioDelay(300, sequence)
			reporter.audioDelay(300, sequence)
			reporter.setRunning(false)
			reporter.setRunning(true)
		}
		assert.equal(events.length, 20)
		reporter.stop()
	} finally {
		Date.now = original.now
		global.setInterval = original.setInterval
		global.clearInterval = original.clearInterval
	}
	console.log(
		"Parity checks passed: durable transfer, eviction/retry, migration, cached forced update, analytics, upload isolation, performance.",
	)
}
main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})

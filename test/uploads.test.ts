import assert from "node:assert/strict"
import test from "node:test"

import { emptyData, type Capture, type Word } from "@/services/data"
import {
  createUploadWorker,
  type UploadDependencies,
  type UploadResponse,
} from "@/services/api/uploadWorker"

function capture(id: string, index = 0, sizeBytes = 10): Capture {
  return {
    id,
    sessionId: "session",
    wordId: "training-word",
    clientWordId: "library-word",
    parrotSpecies: "bird",
    parrotBirthdate: null,
    cycle: 1,
    phase: "learning",
    capturedAt: new Date(index * 1000).toISOString(),
    uri: `recording://session-captures/${id}.wav`,
    fileName: `${id}.wav`,
    segments: [],
    sizeBytes,
  }
}

function word(id: string, index = 0): Word {
  return {
    id,
    label: id,
    tag: "etc",
    sourceType: "recording",
    audioUri: `recording://${id}.m4a`,
    createdAt: new Date(index * 1000).toISOString(),
    updatedAt: new Date(index * 1000).toISOString(),
  }
}

function accepted(items: Capture[]): UploadResponse {
  return {
    status: 201,
    body: { data: Object.fromEntries(items.map((item) => [item.id, { status: "success" }])) },
  }
}

function setup(items: Capture[], overrides: Partial<UploadDependencies> = {}) {
  let data = emptyData("en")

  data.settings.uploadConsent.status = "granted"
  data.captures = Object.fromEntries(items.map((item) => [item.id, item]))
  const requests: string[][] = []
  const removed: string[] = []
  const events: unknown[] = []
  const failures: unknown[] = []
  const io: UploadDependencies = {
    read: () => data,
    update: (change) => {
      const next = structuredClone(data)

      change(next)
      data = next

      return next
    },
    identity: () => "restored-uid",
    configured: () => true,
    inspect: async (uri) => ({
      exists: true,
      size: Object.values(data.captures).find((item) => item.uri === uri)?.sizeBytes ?? 10,
    }),
    sendCaptures: async (items) => {
      requests.push(items.map((item) => item.id))

      return accepted(items)
    },
    sendWord: async () => ({ status: 200, body: null }),
    cleanup: async () => {
      for (const uri of data.pendingFileDeletes) {
        assert.ok(!Object.values(data.captures).some((item) => item.uri === uri))
        removed.push(uri)
      }

      data.pendingFileDeletes = []
    },
    resolved: (...args) => events.push(args),
    aborted: (...args) => failures.push(args),
    rejectedWord: () => {},
    error: () => {},
    ...overrides,
  }

  return {
    io,
    worker: createUploadWorker(io),
    read: () => data,
    requests,
    removed,
    events,
    failures,
  }
}

test("progressing partial response removes only explicitly resolved sent IDs", async () => {
  const a = capture("a")
  const b = capture("b", 1)
  const c = capture("c", 2)
  const h = setup([a, b, c])

  h.io.sendCaptures = async (items) => {
    h.requests.push(items.map((item) => item.id))

    return h.requests.length === 1
      ? {
          status: 200,
          body: {
            data: {
              a: { status: "success" },
              b: { status: "rejected" },
              alien: { status: "success" },
            },
          },
        }
      : accepted(items)
  }

  await h.worker.triggerCaptures("session_end")
  assert.deepEqual(h.requests, [["a", "b", "c"], ["c"]])
  assert.deepEqual(h.removed, [a.uri, b.uri, c.uri])
  assert.deepEqual(h.read().captures, {})
  assert.equal(h.events.length, 3)
  assert.deepEqual(h.failures, [])
})
test("4xx splits only files actually sent, preserving identical IDs and metadata", async () => {
  const a = capture("a")
  const missing = capture("missing", 1)
  const c = capture("c", 2)
  const h = setup([a, missing, c], {
    inspect: async (uri) => ({ exists: uri !== missing.uri, size: 10 }),
  })

  h.io.sendCaptures = async (items) => {
    h.requests.push(items.map((item) => item.id))
    assert.deepEqual(items[0], h.read().captures[items[0].id])

    return items.length > 1
      ? { status: 400, body: null }
      : items[0].id === "a"
        ? accepted(items)
        : { status: 422, body: "rejected" }
  }

  await h.worker.triggerCaptures("session_end")
  assert.deepEqual(h.requests, [["a", "c"], ["a"], ["c"]])
  assert.deepEqual(h.removed, [a.uri, c.uri])
  assert.deepEqual(h.read().captures, {})
  assert.equal((h.events[1] as unknown[])[3], 422)
})
test("consent is checked between split requests and unknown results remain pending", async () => {
  const a = capture("a")
  const b = capture("b", 1)
  const h = setup([a, b])

  h.io.sendCaptures = async (items) => {
    h.requests.push(items.map((item) => item.id))

    if (items.length > 1) {
      return { status: 413, body: null }
    }

    h.io.update((data) => {
      data.settings.uploadConsent.status = "denied"
    })

    return accepted(items)
  }

  await h.worker.triggerCaptures("session_end")
  assert.deepEqual(h.requests, [["a", "b"], ["a"]])
  assert.ok(h.read().captures.b)
  assert.deepEqual(h.removed, [a.uri])
  const unknown = setup([a], {
    sendCaptures: async () => ({ status: 200, body: { data: { a: { status: "maybe" } } } }),
  })

  await unknown.worker.triggerCaptures("session_end")
  assert.ok(unknown.read().captures.a)
  assert.deepEqual(unknown.removed, [])
  assert.equal(unknown.failures.length, 1)
})
test("accumulation triggers arriving during a transient failure cannot bypass retry suppression", async () => {
  const items = Array.from({ length: 10 }, (_, index) => capture(String(index), index))
  let started!: () => void
  let release!: (response: UploadResponse) => void
  const ready = new Promise<void>((resolve) => {
    started = resolve
  })
  const h = setup(items)

  h.io.sendCaptures = async (batch) => {
    h.requests.push(batch.map((item) => item.id))
    started()

    return new Promise((resolve) => {
      release = resolve
    })
  }

  const first = h.worker.triggerCaptures("accumulation")

  await ready
  const accumulated = h.worker.triggerCaptures("accumulation")

  assert.equal(first, accumulated)
  release({ status: 503, body: null })
  await first
  await h.worker.triggerCaptures("accumulation")
  assert.equal(h.requests.length, 1)
  assert.equal(h.failures.length, 1)
  assert.equal(h.removed.length, 0)
  h.io.sendCaptures = async (batch) => {
    h.requests.push(batch.map((item) => item.id))

    return accepted(batch)
  }

  await h.worker.triggerCaptures("network")
  assert.equal(h.requests.length, 2)
  assert.deepEqual(h.read().captures, {})
})
test("one meaningful concurrent trigger coalesces into a new attempt after failure", async () => {
  let started!: () => void
  let release!: (response: UploadResponse) => void
  const ready = new Promise<void>((resolve) => {
    started = resolve
  })
  const h = setup([capture("a")])

  h.io.sendCaptures = async (items) => {
    h.requests.push(items.map((item) => item.id))

    if (h.requests.length > 1) {
      return accepted(items)
    }

    started()

    return new Promise((resolve) => {
      release = resolve
    })
  }

  const running = h.worker.triggerCaptures("session_end")

  await ready
  assert.equal(h.worker.triggerCaptures("foreground"), running)
  assert.equal(h.worker.triggerCaptures("network"), running)
  release({ status: 500, body: null })
  await running
  assert.equal(h.requests.length, 2)
  assert.deepEqual(h.read().captures, {})
})
test("failed persistence and unreadable source files never authorize deletion", async () => {
  const a = capture("a")
  const h = setup([a])

  h.io.update = () => {
    throw Error("MMKV write failed")
  }

  await h.worker.triggerCaptures("session_end")
  assert.ok(h.read().captures.a)
  assert.deepEqual(h.removed, [])
  assert.equal(h.events.length, 0)
  const unreadable = setup([a], {
    inspect: async () => {
      throw Error("permission error")
    },
  })

  await unreadable.worker.triggerCaptures("session_end")
  assert.ok(unreadable.read().captures.a)
  assert.deepEqual(unreadable.removed, [])
  assert.equal(unreadable.requests.length, 0)
})
test("capture batches respect file sum, ten-item ceiling and oversized single handling", async () => {
  const items = [
    capture("huge", 0, 12 * 1024 * 1024),
    capture("four", 1, 4 * 1024 * 1024),
    capture("six", 2, 6 * 1024 * 1024),
    ...Array.from({ length: 12 }, (_, index) => capture(String(index), index + 3)),
  ]
  const h = setup(items)

  await h.worker.triggerCaptures("session_end")
  assert.deepEqual(
    h.requests.map((items) => items.length),
    [1, 1, 10, 3],
  )
  assert.deepEqual(h.requests[0], ["huge"])
  assert.deepEqual(h.requests[1], ["four"])
  assert.equal(h.removed.length, items.length)
})
test("recorded words retry on later cold starts with original IDs and never delete references", async () => {
  const h = setup([])
  const a = word("a", 1)
  const b = word("b", 2)
  const preset = { ...word("preset"), sourceType: "preset" as const }

  h.io.update((data) => {
    data.words = { b, preset, a }
  })
  const sent: string[] = []

  h.io.sendWord = async (item) => {
    sent.push(item.id)

    return { status: item.id === "a" ? 204 : 400, body: null }
  }

  await h.worker.triggerWords(true)
  assert.deepEqual(sent, ["a", "b"])
  assert.deepEqual(h.read().pendingWords, [])
  await h.worker.triggerWords(true)
  assert.deepEqual(sent, ["a", "b", "a", "b"])
  assert.deepEqual(h.removed, [])
  assert.equal(Object.keys(h.read().words).length, 3)
  h.io.sendWord = async (item) => {
    sent.push(item.id)

    return { status: 503, body: null }
  }

  await h.worker.triggerWords(true)
  assert.equal(sent.at(-1), "a")
  assert.deepEqual(h.read().pendingWords, ["b", "a"])
})
test("missing consent, identity, origin and cancelled requests leave capture data intact", async () => {
  for (const gate of ["consent", "identity", "origin", "cancel"]) {
    const h = setup([capture("a")])

    if (gate === "consent") {
      h.io.update((data) => {
        data.settings.uploadConsent.status = "unknown"
      })
    }

    if (gate === "identity") {
      h.io.identity = () => null
    }

    if (gate === "origin") {
      h.io.configured = () => false
    }

    const controller = new AbortController()

    if (gate === "cancel") {
      controller.abort()
    }

    await h.worker.triggerCaptures("session_end", controller.signal)
    assert.ok(h.read().captures.a)
    assert.deepEqual(h.requests, [])
    assert.deepEqual(h.removed, [])
  }
})

test("word acknowledgement preserves and sends a newer recording saved during the request", async () => {
  for (const status of [200, 400]) {
    let started!: () => void
    let release!: (response: UploadResponse) => void
    const ready = new Promise<void>((resolve) => {
      started = resolve
    })
    const h = setup([])
    const original = word("same-id")

    h.io.update((data) => {
      data.words[original.id] = original
    })
    const sent: string[] = []

    h.io.sendWord = async (item) => {
      sent.push(item.audioUri)

      if (sent.length > 1) {
        return { status: 200, body: null }
      }

      started()

      return new Promise((resolve) => {
        release = resolve
      })
    }

    const running = h.worker.triggerWords(false, original.id)

    await ready
    h.io.update((data) => {
      data.words[original.id] = {
        ...original,
        audioUri: "recording://new-take.m4a",
        updatedAt: "2026-09-09T00:00:00Z",
      }
    })
    assert.equal(h.worker.triggerWords(false, original.id), running)
    release({ status, body: null })
    await running
    assert.deepEqual(sent, [original.audioUri, "recording://new-take.m4a"])
    assert.deepEqual(h.read().pendingWords, [])
    assert.equal(h.read().words[original.id].audioUri, "recording://new-take.m4a")
    assert.deepEqual(h.removed, [])
  }
})

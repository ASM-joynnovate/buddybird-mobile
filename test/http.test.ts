import assert from "node:assert/strict"
import { createServer } from "node:http"
import { once } from "node:events"
import { test } from "node:test"

import { HttpError, requestJSON, ResponseError, TimeoutError } from "@/services/api/http"

test("HTTP transport: JSON, server failures, malformed responses, timeout and cancellation", async () => {
  let requests = 0
  const server = createServer((req, res) => {
    requests++

    if (req.url === "/slow") {
      return
    }

    if (req.url === "/error") {
      res.writeHead(503)
      res.end('{"message":"unavailable"}')
    } else if (req.url === "/invalid") {
      res.end("not json")
    } else {
      res.end('{"ok":true}')
    }
  }).listen(0, "127.0.0.1")

  await once(server, "listening")
  const address = server.address()

  assert.ok(address && typeof address !== "string")
  const url = `http://127.0.0.1:${address.port}`

  try {
    assert.deepEqual(await requestJSON(url), { ok: true })
    await assert.rejects(requestJSON(`${url}/error`), (error: unknown) => {
      assert.ok(error instanceof HttpError)
      assert.equal(error.status, 503)
      assert.equal(error.retryable, true)
      assert.deepEqual(error.body, { message: "unavailable" })

      return true
    })
    assert.equal(requests, 2, "transport must not retry failures")
    await assert.rejects(requestJSON(`${url}/invalid`), ResponseError)
    await assert.rejects(requestJSON(`${url}/slow`, { timeoutMs: 30 }), TimeoutError)
    const cancelled = new AbortController()

    cancelled.abort()
    await assert.rejects(requestJSON(url, { signal: cancelled.signal }), { name: "AbortError" })
    const active = new AbortController()
    const pending = requestJSON(`${url}/slow`, { signal: active.signal })

    setTimeout(() => active.abort(), 20)
    await assert.rejects(pending, { name: "AbortError" })
  } finally {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
})

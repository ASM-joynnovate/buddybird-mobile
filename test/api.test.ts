import assert from "node:assert/strict"
import { createServer } from "node:http"
import test from "node:test"

import { unzipSync } from "fflate"

import { HttpError, requestJSON, TimeoutError } from "@/services/api/http"
import { writeCaptureZip } from "@/services/api/zip"

test("single-attempt HTTP accepts non-JSON words responses and reads timeout-bound bodies", async (t) => {
  const visits: string[] = []
  const server = createServer((request, response) => {
    visits.push(request.url!)

    if (request.url === "/slow") {
      response.writeHead(200)
      response.write("{")

      return
    }

    if (request.url === "/reject") {
      response.writeHead(422)
      response.end("not-json")

      return
    }

    if (request.url === "/empty") {
      response.writeHead(204)
      response.end()

      return
    }

    response.end("accepted")
  })

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()

  assert.ok(address && typeof address !== "string")
  const base = `http://127.0.0.1:${address.port}`

  assert.equal(await requestJSON(base + "/words", { optionalJSON: true }), null)
  assert.equal(await requestJSON(base + "/empty"), null)
  await assert.rejects(
    requestJSON(base + "/reject"),
    (error) => error instanceof HttpError && error.status === 422 && error.body === null,
  )
  await assert.rejects(requestJSON(base + "/slow", { timeoutMs: 40 }), TimeoutError)
  assert.deepEqual(visits, ["/words", "/empty", "/reject", "/slow"])
})
test("streamed ZIP uses exact entry names and round trips source bytes", async () => {
  const output: Uint8Array[] = []
  const bytes = new TextEncoder().encode("synthetic sound ".repeat(6000))

  async function* chunks() {
    for (let i = 0; i < bytes.length; i += 1024) {
      yield bytes.subarray(i, i + 1024)
    }
  }

  await writeCaptureZip(
    [
      { name: "session-a-capture-a.wav", chunks: chunks() },
      { name: "session-b-capture-b.wav", chunks: chunks() },
    ],
    (chunk) => output.push(chunk),
  )
  const decoded = unzipSync(Buffer.concat(output))

  assert.deepEqual(Object.keys(decoded), ["session-a-capture-a.wav", "session-b-capture-b.wav"])
  assert.deepEqual(decoded["session-a-capture-a.wav"], bytes)
  assert.deepEqual(decoded["session-b-capture-b.wav"], bytes)
  await assert.rejects(
    writeCaptureZip([{ name: "../bad.wav", chunks: chunks() }], () => {}),
    /Invalid/,
  )
  await assert.rejects(
    writeCaptureZip([{ name: "valid.wav", chunks: chunks() }], () => {
      throw Error("disk full")
    }),
    /disk full/,
  )
  const controller = new AbortController()

  controller.abort()
  await assert.rejects(
    writeCaptureZip([{ name: "valid.wav", chunks: chunks() }], () => {}, controller.signal),
    /cancelled/,
  )
})

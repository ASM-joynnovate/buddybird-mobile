import assert from "node:assert/strict"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

import { mediaUri } from "@/utils/mediaUri"

test("media rebases stale containers and keeps nested recording names without path escape", () => {
  const document = "file:///new/Documents/"

  assert.equal(
    mediaUri("recording://session-captures/a.wav", document),
    document + "recordings/session-captures/a.wav",
  )
  assert.equal(
    mediaUri("file:///old/Documents/recordings/nested/a.wav", document),
    document + "recordings/nested/a.wav",
  )
  assert.equal(mediaUri("photo://a.jpg", document), document + "photos/a.jpg")
  assert.equal(
    mediaUri(
      "file:///old/Library/Caches/ImagePicker/a.jpg",
      document,
      "file:///new/Library/Caches/",
    ),
    "file:///new/Library/Caches/ImagePicker/a.jpg",
  )

  for (const suffix of [
    "../secret",
    "%2e%2e/secret",
    "/absolute",
    "a/../../secret",
    "a\\secret",
    "",
  ]) {
    assert.throws(() => mediaUri("recording://" + suffix, document))
  }

  assert.equal(mediaUri("content://picked-photo", document), "content://picked-photo")
})

test("migrated photo references resolve to the literal saved filename", () => {
  const fileName = "profile-parrot-2026-09-09T07%3A03%3A02.762Z.jpg"
  const resolvedUri = mediaUri(`photo://${fileName}`, "file:///new/Documents/")

  assert.equal(fileURLToPath(resolvedUri), `/new/Documents/photos/${fileName}`)
})

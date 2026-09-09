import assert from "node:assert/strict"
import { test } from "node:test"

import current from "@test/fixtures/asyncstorage-current.json"
import historical from "@test/fixtures/asyncstorage-historical.json"
import { convertLegacy } from "@/services/legacy"
import { DATA_KEY, LEGACY_KEY, MIGRATION_KEY, migrateRecords } from "@/services/persistence"

const libraryId = "wentry-2026-06-20T12:01:00.000Z-library01"
const trainingId = "word-2026-06-20T12:05:00.000Z-training01"

test("current migration preserves IDs, history/audio and independent consents", () => {
  const data = convertLegacy(current.entries, "ko")

  assert.equal(data.profile?.id, "parrot-2026-06-20T12:00:00.000Z")
  assert.equal(data.settings.locale, "en")
  assert.equal(data.settings.analyticsConsent, "denied")
  assert.equal(data.settings.uploadConsent.status, "granted")
  assert.deepEqual(Object.keys(data.words), [libraryId])
  assert.equal(data.wordAliases[trainingId], libraryId)
  const history = Object.values(data.history)[0]

  assert.equal(history.wordId, trainingId)
  assert.equal(history.id, "sess_mf4k9000_0011223344")
  assert.equal(history.word.audioUri, data.words[libraryId].audioUri)
  assert.equal(data.progress[trainingId].totalTrainingSeconds, 1200)
  assert.ok(data.progress[trainingId].successMarkedAt)
  assert.equal(Object.values(data.captures)[0].clientWordId, libraryId)
  assert.deepEqual(data.pendingWords, [libraryId])
})

test("historical profile, Korean tags, capture metadata and missing word links", () => {
  for (const variant of historical.cases) {
    const entries: Record<string, string> = { ...current.entries }

    if ("key" in variant && variant.key) {
      entries[variant.key] = JSON.stringify(variant.value)
    }

    if ("trainingWord" in variant && variant.trainingWord) {
      const training = JSON.parse(entries["@buddybird/training-store"])

      training.wordsById[trainingId] = variant.trainingWord
      entries["@buddybird/training-store"] = JSON.stringify(training)
    }

    const data = convertLegacy(entries, "ko")

    if (variant.name === "profile-age-custom-species") {
      assert.equal(data.profile?.birthDate, "2025-11-01")
      assert.equal(data.profile?.species, "장미앵무")
    }

    if (variant.name === "profile-parakeet") {
      assert.equal(data.profile?.species, "budgie")
    }

    if (variant.name === "explicit-unknown-birthday") {
      assert.equal(data.profile?.birthDate, null)
    }

    if (variant.name === "word-korean-tag-absolute-uri-pitch") {
      assert.equal(data.words[libraryId].tag, "greeting")
      assert.match(data.words[libraryId].audioUri, /old-container/)
      assert.equal(data.words[libraryId].transformedAudioUri, "recording://pitch-fixture.m4a")
      assert.notEqual(
        data.history["sess_mf4k9000_0011223344"].word.audioUri,
        data.words[libraryId].audioUri,
      )
    }

    if (variant.name === "capture-before-phase-and-metadata") {
      const capture = Object.values(data.captures)[0]

      assert.equal(capture.phase, "learning")
      assert.equal(capture.clientWordId, libraryId)
      assert.equal(capture.parrotSpecies, data.profile?.species)
    }

    if (variant.name === "training-word-before-library-link") {
      assert.equal(data.wordAliases[trainingId], undefined)
      assert.equal(data.words[trainingId].id, trainingId)
      assert.equal(data.words[trainingId].archived, true)
      assert.equal(Object.keys(data.words).length, 2, "same labels must not merge identities")
    }
  }
})

test("write failure, readback failure and process interruption never mark incomplete migration done", () => {
  const original = JSON.stringify(current.entries)

  for (const failAt of [1, 2, 3]) {
    const values = new Map<string, string>()
    let writes = 0
    const store = {
      getString: (key: string) => values.get(key),
      set: (key: string, value: string) => {
        if (++writes === failAt) {
          throw new Error("disk full")
        }

        values.set(key, value)
      },
    }

    assert.throws(() => migrateRecords(store, current.entries, "ko"), /disk full/)
    assert.notEqual(values.get(MIGRATION_KEY), "complete")
    store.set = (key, value) => {
      values.set(key, value)
    }

    const migrated = migrateRecords(store, current.entries, "ko")

    assert.equal(values.get(LEGACY_KEY), original)
    assert.deepEqual(JSON.parse(values.get(DATA_KEY)!), migrated)
    assert.equal(values.get(MIGRATION_KEY), "complete")
    assert.deepEqual(
      migrateRecords(store, { "@buddybird/parrot-profile": "corrupt" }, "en"),
      migrated,
    )
  }

  const values = new Map<string, string>()
  const corruptStore = {
    getString: (key: string) => values.get(key),
    set: (key: string, value: string) => {
      values.set(key, key === DATA_KEY ? "corrupted write" : value)
    },
  }

  assert.throws(() => migrateRecords(corruptStore, current.entries, "ko"), /verification/)
  assert.equal(values.get(MIGRATION_KEY), undefined)
  assert.equal(JSON.stringify(current.entries), original)
})

test("malformed known records stop migration; absent records create a new installation", () => {
  assert.equal(convertLegacy({}, "en").profile, null)

  for (const key of [
    "parrot-profile",
    "wordLibrary",
    "training-store",
    "follow-along-captures",
    "upload-consent",
    "app-update",
    "feedback-prompt",
  ]) {
    assert.throws(() =>
      convertLegacy({ ...current.entries, [`@buddybird/${key}`]: "{broken" }, "ko"),
    )
  }

  assert.throws(
    () =>
      convertLegacy(
        { ...current.entries, "@buddybird/wordLibrary": '{"version":2,"entriesById":{}}' },
        "ko",
      ),
    /Unsupported/,
  )
  const values = new Map([[MIGRATION_KEY, "complete"]])

  assert.throws(
    () =>
      migrateRecords(
        {
          getString: (k) => values.get(k),
          set: (k, v) => {
            values.set(k, v)
          },
        },
        {},
        "en",
      ),
    /missing/,
  )
})

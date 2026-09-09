import { randomUUID } from "expo-crypto"

import { AppData, Locale, Profile, Word } from "@/services/data"
import { preservePhoto, preserveRecording } from "@/services/media"
import { readData, updateData } from "@/services/storage"

export const presets = [
  { presetKey: "hello", label: "안녕", tag: "greeting" },
  { presetKey: "apple", label: "사과", tag: "food" },
  { presetKey: "saranghae", label: "사랑해", tag: "greeting" },
  { presetKey: "bye", label: "다녀와", tag: "greeting" },
  { presetKey: "en-hi", label: "Hi", tag: "greeting" },
  { presetKey: "en-hello", label: "Hello", tag: "greeting" },
] as const

export function seedPresets() {
  const data = readData()
  const missing = presets.filter(
    (preset) =>
      !Object.values(data.words).some(
        (word) => word.presetKey === preset.presetKey && !word.archived,
      ),
  )

  if (!missing.length) {
    return
  }

  updateData((next) => {
    const now = new Date().toISOString()

    for (const preset of missing) {
      const id = `preset-library-${preset.presetKey}`

      next.words[id] = {
        ...preset,
        id,
        sourceType: "preset",
        audioUri: `preset://${preset.presetKey}`,
        createdAt: now,
        updatedAt: now,
      }
    }
  })
}

export function visibleWords(data: AppData, locale: Locale) {
  return Object.values(data.words).filter(
    (word) =>
      !word.archived &&
      (word.sourceType === "recording" || word.presetKey?.startsWith("en-") === (locale === "en")),
  )
}

export async function saveProfile(
  input: Pick<Profile, "name" | "species" | "birthDate" | "photoUri">,
): Promise<Profile> {
  if (!input.name.trim() || !input.species.trim()) {
    throw new Error("Name and species are required")
  }

  if (input.birthDate !== null) {
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.birthDate)

    if (!parts) {
      throw new Error("Invalid birth date")
    }

    const [year, month, day] = parts.slice(1).map(Number)
    const date = new Date(year, month - 1, day)

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day ||
      date.getTime() > Date.now()
    ) {
      throw new Error("Invalid birth date")
    }
  }

  const previous = readData().profile
  let photoUri = input.photoUri

  if (photoUri && photoUri !== previous?.photoUri && !photoUri.startsWith("photo://")) {
    photoUri = await preservePhoto(photoUri)
  }

  const now = new Date().toISOString()
  const profile: Profile = {
    id: previous?.id ?? `parrot-${now}`,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
    name: input.name.trim(),
    species: input.species.trim(),
    birthDate: input.birthDate,
    photoUri,
  }

  updateData((data) => {
    if (previous?.photoUri && previous.photoUri !== photoUri) {
      data.pendingFileDeletes.push(previous.photoUri)
    }

    data.profile = profile
  })

  return profile
}

export async function saveWord(input: {
  label: string
  tag: Word["tag"]
  recordingUri: string
  id?: string
}): Promise<Word> {
  const label = input.label.trim()

  if (!label || !["greeting", "food", "name", "etc"].includes(input.tag)) {
    throw new Error("Word and category are required")
  }

  const existing = input.id ? readData().words[input.id] : undefined

  if (input.id && (!existing || existing.archived || existing.sourceType !== "recording")) {
    throw new Error("Word cannot be edited")
  }

  const audioUri = await preserveRecording(input.recordingUri)
  const now = new Date().toISOString()
  const word: Word = {
    id: existing?.id ?? `wentry-${now}-${randomUUID().slice(0, 8)}`,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    label,
    tag: input.tag,
    sourceType: "recording",
    audioUri,
  }

  updateData((data) => {
    if (existing?.audioUri) {
      data.pendingFileDeletes.push(existing.audioUri)
    }

    data.words[word.id] = word
    const metrics = data.settings.wordMetrics[word.id]

    data.settings.wordMetrics[word.id] = {
      word_id: word.id,
      word_name: word.label,
      lifetime_practice_count: metrics?.lifetime_practice_count ?? 0,
      lifetime_practice_duration_ms: metrics?.lifetime_practice_duration_ms ?? 0,
      lifetime_recording_count: (metrics?.lifetime_recording_count ?? 0) + 1,
      last_practiced_at_iso: metrics?.last_practiced_at_iso ?? null,
    }

    if (!data.pendingWords.includes(word.id)) {
      data.pendingWords.push(word.id)
    }
  })

  return word
}

export function removeWord(id: string) {
  updateData((data) => {
    const word = data.words[id]

    if (!word || word.sourceType !== "recording") {
      throw new Error("Word cannot be deleted")
    }

    word.archived = true
    word.updatedAt = new Date().toISOString()
    data.pendingWords = data.pendingWords.filter((value) => value !== id)
    // Historical snapshots and queued captures still retain their referenced files.
    data.pendingFileDeletes.push(word.audioUri)

    if (word.transformedAudioUri) {
      data.pendingFileDeletes.push(word.transformedAudioUri)
    }
  })
}

export function removeProfile() {
  updateData((data) => {
    if (data.profile?.photoUri) {
      data.pendingFileDeletes.push(data.profile.photoUri)
    }

    data.profile = null
  })
}

import { Asset } from "expo-asset"
import { randomUUID } from "expo-crypto"
import { Directory, File, Paths } from "expo-file-system"

import { WordSnapshot } from "@/services/data"
import { mediaUri } from "@/utils/mediaUri"

const assets: Record<string, number> = {
  "hello": require("@assets/audio/ko-kr/default_An-nyeong.m4a"),
  "apple": require("@assets/audio/ko-kr/default_Sa-gwa.m4a"),
  "saranghae": require("@assets/audio/ko-kr/default_Sa-rang-hae.m4a"),
  "bye": require("@assets/audio/ko-kr/default_Da-nyeo-wa.m4a"),
  "en-hi": require("@assets/audio/en-us/default_hi.m4a"),
  "en-hello": require("@assets/audio/en-us/default_hello.m4a"),
}
const careAssets = [
  require("@assets/audio/stress-care/track-02.m4a"),
  require("@assets/audio/stress-care/track-03.m4a"),
  require("@assets/audio/stress-care/track-04.m4a"),
]

async function localAsset(id: number) {
  const asset = await Asset.fromModule(id).downloadAsync()

  if (!asset.localUri) {
    throw new Error("Audio asset unavailable")
  }

  return asset.localUri
}

export function resolveRecordingUri(uri: string) {
  return mediaUri(uri, Paths.document.uri, Paths.cache.uri)
}

export async function resolveAudio(word: WordSnapshot) {
  if (word.sourceType === "preset") {
    const id = word.presetKey ? assets[word.presetKey] : undefined

    if (id === undefined) {
      throw new Error("Unknown preset audio")
    }

    return localAsset(id)
  }

  const uri = resolveRecordingUri(word.audioUri)

  if (!new File(uri).exists) {
    throw new Error("Recording unavailable")
  }

  return uri
}

export function stressCareAudio() {
  return Promise.all(careAssets.map(localAsset))
}

export function captureDirectory() {
  const directory = new Directory(Paths.document, "recordings", "session-captures")

  directory.create({ idempotent: true, intermediates: true })

  return directory.uri
}

export async function preserveRecording(uri: string) {
  const directory = new Directory(Paths.document, "recordings")

  directory.create({ idempotent: true, intermediates: true })
  const source = new File(uri)
  const fileName = `recording-${randomUUID()}.${source.extension.replace(/^\./, "") || "m4a"}`
  const target = new File(directory, fileName)

  source.copy(target)

  if (!target.exists || target.size !== source.size) {
    throw new Error("Recording save failed")
  }

  return `recording://${fileName}`
}

export async function preservePhoto(uri: string, migrationId?: string) {
  const directory = new Directory(Paths.document, "photos")

  directory.create({ idempotent: true, intermediates: true })
  const source = new File(resolveRecordingUri(uri))
  const photoId = migrationId ? encodeURIComponent(migrationId) : randomUUID()
  const extension = source.extension.replace(/^\./, "") || "jpg"
  const fileName = `profile-${photoId}.${extension}`
  const target = new File(directory, fileName)

  if (target.exists && migrationId && target.size === source.size) {
    return `photo://${fileName}`
  }

  if (target.exists && migrationId) {
    target.delete()
  }

  source.copy(target)

  if (!target.exists || target.size !== source.size) {
    throw new Error("Photo save failed")
  }

  return `photo://${fileName}`
}

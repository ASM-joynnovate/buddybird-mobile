import AsyncStorage from "@react-native-async-storage/async-storage"
import { File } from "expo-file-system"

import { getLocales } from "expo-localization"

import { convertLegacy } from "@/services/legacy"
import { preservePhoto, resolveRecordingUri } from "@/services/media"
import { AppData } from "@/services/data"
import { migrateRecords, MIGRATION_KEY } from "@/services/persistence"
import { readData, storage } from "@/services/storage"

let pending: Promise<AppData> | undefined

export function migrateData(): Promise<AppData> {
  if (pending) {
    return pending
  }

  pending = (async () => {
    if (storage.getString(MIGRATION_KEY) === "complete") {
      return readData()
    }

    const keys = (await AsyncStorage.getAllKeys()).filter(
      (key) => key.startsWith("@buddybird/") || key.startsWith("@pethub/"),
    )
    const entries = await AsyncStorage.multiGet(keys)
    const originals: Record<string, string> = {}

    for (const [key, value] of entries) {
      if (value !== null) {
        originals[key] = value
      }
    }

    const locale = getLocales()[0]?.languageCode === "ko" ? "ko" : "en"
    const data = convertLegacy(originals, locale)
    const photo = data.profile?.photoUri

    if (photo && !photo.startsWith("photo://") && new File(resolveRecordingUri(photo)).exists) {
      data.profile!.photoUri = await preservePhoto(photo, data.profile!.id)
    }

    return migrateRecords(storage, originals, locale, data)
  })().finally(() => {
    pending = undefined
  })

  return pending
}

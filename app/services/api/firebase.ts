import { getAuth, onAuthStateChanged, signInAnonymously } from "@react-native-firebase/auth"
import { addDoc, collection, getFirestore, serverTimestamp } from "@react-native-firebase/firestore"
import {
  fetchAndActivate,
  getRemoteConfig,
  getString,
  setConfigSettings,
  setDefaults,
} from "@react-native-firebase/remote-config"
import { mutationOptions, queryOptions } from "@tanstack/react-query"
import * as Application from "expo-application"
import Constants from "expo-constants"
import { Linking, Platform } from "react-native"

import { config } from "@/config"
import type { Locale } from "@/services/data"
import { readData, updateData } from "@/services/storage"
import {
  coalesceIdentity,
  parseReleaseNotes,
  UPDATE_INTERVAL,
  validateFeedback,
} from "@/services/api/policy"

export const installedVersion =
  Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? "1.1.0"

export const currentIdentity = () => getAuth().currentUser?.uid ?? null

export const ensureAnonymousIdentity = coalesceIdentity(
  currentIdentity,
  async () => (await signInAnonymously(getAuth())).user.uid,
)

export const identityQueryOptions = () =>
  queryOptions({
    queryKey: ["firebase", "identity"],
    queryFn: ensureAnonymousIdentity,
    staleTime: Infinity,
    networkMode: "always",
  })

export function subscribeIdentity(listener: (uid: string | null) => void) {
  return onAuthStateChanged(getAuth(), (user) => listener(user?.uid ?? null))
}

export async function fetchUpdatePolicy() {
  updateData((data) => {
    data.settings.update.lastCheckedAt = Date.now()
  })
  const remote = getRemoteConfig()

  await setConfigSettings(remote, {
    minimumFetchIntervalMillis: config.production ? UPDATE_INTERVAL : 0,
  })
  await setDefaults(remote, { latest_version: "", min_supported_version: "", release_notes: "{}" })
  await fetchAndActivate(remote)

  return {
    latestVersion: getString(remote, "latest_version").trim(),
    minimumVersion: getString(remote, "min_supported_version").trim(),
    notes: parseReleaseNotes(getString(remote, "release_notes")),
  }
}

// Remote Config owns its cache. A failed attempt also starts the six-hour window.
export const updateQueryOptions = () =>
  queryOptions({
    queryKey: ["firebase", "update"],
    queryFn: fetchUpdatePolicy,
    staleTime: UPDATE_INTERVAL,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

export function dismissUpdate(latestVersion: string) {
  updateData((data) => {
    data.settings.update.dismissedVersion = latestVersion
  })
}

export async function openStore() {
  const id = config.production ? "6783652711" : "6784253530"
  const appId = Application.applicationId

  if (Platform.OS !== "ios" && !appId) {
    throw new Error("Missing installed application ID")
  }

  const native =
    Platform.OS === "ios"
      ? `itms-apps://apps.apple.com/app/id${id}`
      : `market://details?id=${appId}`
  const web =
    Platform.OS === "ios"
      ? `https://apps.apple.com/app/id${id}`
      : `https://play.google.com/store/apps/details?id=${appId}`

  try {
    await Linking.openURL(native)
  } catch {
    await Linking.openURL(web)
  }
}

export async function submitFeedback(input: { message: string; locale: Locale }) {
  readData() // The migration gate applies to server writes too.
  const message = validateFeedback(input.message)
  const userId = await ensureAnonymousIdentity()

  if (!userId) {
    throw new Error("Authentication unavailable")
  }

  await addDoc(collection(getFirestore(), "feedback"), {
    userId,
    message,
    appVersion: installedVersion,
    platform: Platform.OS,
    locale: input.locale,
    createdAt: serverTimestamp(),
  })
}

export const feedbackMutationOptions = () =>
  mutationOptions({
    mutationKey: ["firebase", "feedback"],
    mutationFn: submitFeedback,
    retry: false,
  })

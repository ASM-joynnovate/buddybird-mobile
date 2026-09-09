import {
  AuthorizationStatus,
  getInitialNotification,
  getIsHeadless as nativeIsHeadless,
  getMessaging,
  getToken,
  hasPermission,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  requestPermission,
  setBackgroundMessageHandler,
  type FirebaseMessagingTypes,
} from "@react-native-firebase/messaging"
import { randomUUID } from "expo-crypto"
import { PermissionsAndroid, Platform } from "react-native"
import { MMKV, Mode } from "react-native-mmkv"

import type { PushAuthorization, PushReceipt } from "@/services/data"
import { newestReceipts } from "@/services/api/policy"
import { readData, updateData } from "@/services/storage"
import { reportError } from "@/services/telemetry"

let inbox: MMKV | null = null
let interactive = false
const receiptInbox = () =>
  (inbox ??= new MMKV({ id: "buddybird-push-inbox", mode: Mode.MULTI_PROCESS }))

// Android background messages run in a separate Headless JS task without mounting App.
export const getIsHeadless = () =>
  Platform.OS === "ios" ? nativeIsHeadless(getMessaging()) : Promise.resolve(false)

function receipt(
  message: FirebaseMessagingTypes.RemoteMessage,
  source: PushReceipt["source"],
): PushReceipt {
  return {
    messageId: message.messageId ?? null,
    from: message.from ?? null,
    sentTime: typeof message.sentTime === "number" ? message.sentTime : null,
    source,
    receivedAt: new Date().toISOString(),
  }
}

export function mergePushReceipts() {
  const store = receiptInbox()
  const keys = store.getAllKeys()

  if (!keys.length) {
    return
  }

  const pending = keys.map((key) => {
    const raw = store.getString(key)

    if (!raw) {
      throw new Error("Push receipt inbox is unreadable")
    }

    const value = JSON.parse(raw) as PushReceipt

    if (
      !value ||
      typeof value.receivedAt !== "string" ||
      !["foreground", "background", "notification_opened"].includes(value.source)
    ) {
      throw new Error("Invalid push receipt")
    }

    return value
  })

  updateData((data) => {
    data.settings.receipts = newestReceipts([...data.settings.receipts, ...pending])
  })

  for (const key of keys) {
    store.delete(key)
  }
}

function saveReceipt(message: FirebaseMessagingTypes.RemoteMessage, source: PushReceipt["source"]) {
  // Independent inbox permits receipt persistence while app migration is blocked or UI is headless.
  const store = receiptInbox()
  const key = `${Date.now()}-${randomUUID()}`
  const raw = JSON.stringify(receipt(message, source))

  store.set(key, raw)

  if (store.getString(key) !== raw) {
    throw new Error("Push receipt save could not be verified")
  }

  if (interactive) {
    mergePushReceipts()
  }
}

export function registerBackgroundPushHandler() {
  setBackgroundMessageHandler(getMessaging(), async (message) => {
    saveReceipt(message, "background")
  })
}

async function authorization(request: boolean): Promise<PushAuthorization> {
  if (Platform.OS === "android") {
    if (Number(Platform.Version) < 33) {
      return "authorized"
    }

    const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS

    if (await PermissionsAndroid.check(permission)) {
      return "authorized"
    }

    if (!request) {
      return "denied"
    }

    return (await PermissionsAndroid.request(permission)) === PermissionsAndroid.RESULTS.GRANTED
      ? "authorized"
      : "denied"
  }

  const messaging = getMessaging()
  let status = await hasPermission(messaging)

  if (request && status === AuthorizationStatus.NOT_DETERMINED) {
    status = await requestPermission(messaging)
  }

  switch (status) {
    case AuthorizationStatus.AUTHORIZED:
      return "authorized"
    case AuthorizationStatus.PROVISIONAL:
      return "provisional"
    case AuthorizationStatus.EPHEMERAL:
      return "ephemeral"
    case AuthorizationStatus.DENIED:
      return "denied"
    default:
      return "not_determined"
  }
}

async function registerPush() {
  const authorizationStatus = await authorization(true)

  updateData((data) => {
    data.settings.push = {
      token: data.settings.push?.token ?? null,
      authorizationStatus,
      updatedAt: new Date().toISOString(),
    }
  })

  if (authorizationStatus !== "authorized" && authorizationStatus !== "provisional") {
    return
  }

  const messaging = getMessaging()

  if (Platform.OS === "ios" && !messaging.isDeviceRegisteredForRemoteMessages) {
    await registerDeviceForRemoteMessages(messaging)
  }

  const token = await getToken(messaging)

  updateData((data) => {
    data.settings.push = { token, authorizationStatus, updatedAt: new Date().toISOString() }
  })
}

export function startPush() {
  if (!readData().profile) {
    return () => {}
  }

  interactive = true
  mergePushReceipts()
  const safeReceipt = (
    message: FirebaseMessagingTypes.RemoteMessage,
    source: PushReceipt["source"],
  ) => {
    try {
      saveReceipt(message, source)
    } catch (error) {
      reportError(error, "push_receipt")
    }
  }

  const messaging = getMessaging()
  const foreground = onMessage(messaging, (message) => safeReceipt(message, "foreground"))
  const opened = onNotificationOpenedApp(messaging, (message) =>
    safeReceipt(message, "notification_opened"),
  )
  const refresh = onTokenRefresh(messaging, async (token) => {
    try {
      const authorizationStatus = await authorization(false)

      updateData((data) => {
        data.settings.push = { token, authorizationStatus, updatedAt: new Date().toISOString() }
      })
    } catch (error) {
      reportError(error, "push_token")
    }
  })

  void getInitialNotification(messaging)
    .then((message) => {
      if (message) {
        safeReceipt(message, "notification_opened")
      }
    })
    .catch((error) => reportError(error, "push_initial"))
  void registerPush().catch((error) => reportError(error, "push_registration"))

  return () => {
    interactive = false
    foreground()
    opened()
    refresh()
  }
}

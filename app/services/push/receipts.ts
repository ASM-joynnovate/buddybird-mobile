import type { FirebaseMessagingTypes } from "@react-native-firebase/messaging"

import { randomUUID } from "expo-crypto"

import { MMKV, Mode } from "react-native-mmkv"

import { newestReceipts } from "@/services/push/receipt-policy"
import { updateData } from "@/services/storage/data-store"
import type  { PushReceipt } from "@/types/push"

let inbox: MMKV | null = null

let interactive = false

const receiptInbox = () =>
	(inbox ??= new MMKV({ id: "buddybird-push-inbox", mode: Mode.MULTI_PROCESS }))

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

export function saveReceipt(
	message: FirebaseMessagingTypes.RemoteMessage,
	source: PushReceipt["source"],
) {
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

export function setPushInteractive(value: boolean) {
	interactive = value
}

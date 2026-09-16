import { addDoc, collection, getFirestore, serverTimestamp } from "@react-native-firebase/firestore"

import { Platform } from "react-native"

import { ensureAnonymousIdentity } from "@/apis/identity"
import { installedVersion } from "@/lib/application"
import { TimeoutError } from "@/lib/http"
import { validateFeedback } from "@/services/feedback/policy"
import { readData } from "@/services/storage/data-store"
import type  { Locale } from "@/types/locale"

export async function submitFeedback(input: { message: string; locale: Locale }) {
	readData() // The migration gate applies to server writes too.
	const message = validateFeedback(input.message)
	let timedOut = false
	let timer: ReturnType<typeof setTimeout> | undefined
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => {
			timedOut = true
			reject(new TimeoutError())
		}, 5000)
	})

	try {
		await Promise.race([
			ensureAnonymousIdentity().then(async (userId) => {
				if (timedOut) {
					throw new TimeoutError()
				}

				if (!userId) {
					throw new Error("Authentication unavailable")
				}

				// ponytail: submitted writes cannot be cancelled; use request IDs if retries must deduplicate.
				await addDoc(collection(getFirestore(), "feedback"), {
					userId,
					message,
					appVersion: installedVersion,
					platform: Platform.OS,
					locale: input.locale,
					createdAt: serverTimestamp(),
				})
			}),
			timeout,
		])
	} finally {
		clearTimeout(timer)
	}
}

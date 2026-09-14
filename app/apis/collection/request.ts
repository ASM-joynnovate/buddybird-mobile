import * as Device from "expo-device"

import { Platform } from "react-native"

import { codePoints } from "@/apis/collection/metadata"
import { currentIdentity } from "@/apis/identity"
import { config } from "@/config"
import { HttpError, requestJSON } from "@/lib/http"
import { readData } from "@/services/storage/data-store"
import { type UploadResponse } from "@/types/uploads"

export function uploadOrigin() {
	const origin = config.apiBaseUrl.trim().replace(/\/+$/, "")

	if (!origin) {
		return ""
	}

	const parsed = new URL(origin)

	if (
		parsed.protocol !== "https:" ||
		parsed.username ||
		parsed.password ||
		parsed.search ||
		parsed.hash
	) {
		throw new Error("Invalid collection origin")
	}

	return origin
}

export function permitted(signal?: AbortSignal) {
	if (
		signal?.aborted ||
		readData().settings.uploadConsent.status !== "granted" ||
		!currentIdentity()
	) {
		throw new Error("Upload not permitted")
	}
}

export function deviceForm(uid: string) {
	const form = new FormData()

	form.append("firebase_anon_uid", uid)
	form.append("device_platform", Platform.OS === "ios" ? "iOS" : "Android")
	form.append("device_os_version", codePoints(Device.osVersion ?? "", 20))
	form.append("device_model", codePoints(Device.modelName ?? "", 30))

	return form
}

export async function post(
	path: string,
	form: FormData,
	timeoutMs: number,
	signal?: AbortSignal,
): Promise<UploadResponse> {
	const origin = uploadOrigin()

	if (!origin) {
		throw new Error("Collection origin is not configured")
	}

	permitted(signal)

	try {
		return {
			status: 200,
			body: await requestJSON(`${origin}${path}`, {
				method: "POST",
				body: form,
				timeoutMs,
				signal,
				optionalJSON: true,
			}),
		}
	} catch (error) {
		if (error instanceof HttpError) {
			return { status: error.status, body: error.body }
		}

		throw error
	}
}

import { getLocales } from "expo-localization"
import { MMKV } from "react-native-mmkv"

import { writeVerified } from "@/services/storage/verified-write"
import type  { DeviceSettings } from "@/types/device-settings"
import {
	readNullableText,
	requireChoice,
	requireNonnegativeNumber,
	requireRecord,
} from "@/utils/validation"

export const deviceStorage = new MMKV({ id: "buddybird.device" })

export const deviceKeys = {
	locale: "ui/locale",
	analyticsConsent: "consent/analytics",
	update: "update/prompt",
	feedback: "feedback/prompt",
} as const

export function defaultDeviceSettings(): DeviceSettings {
	return {
		locale: getLocales()[0]?.languageCode === "ko" ? "ko" : "en",
		analyticsConsent: "unknown",
		update: { dismissedVersion: null, lastCheckedAt: null },
		feedback: { version: 1, lastCountedDate: null, dayCount: 0, thresholdIndex: 0 },
	}
}

export function decodeDeviceSetting<K extends keyof DeviceSettings>(
	key: K,
	value: unknown,
): DeviceSettings[K] {
	if (key === "locale") {
		return requireChoice(value, ["ko", "en"] as const, "locale") as DeviceSettings[K]
	}

	if (key === "analyticsConsent") {
		return requireChoice(
			value,
			["unknown", "granted", "denied", "not_applicable"] as const,
			"analytics consent",
		) as DeviceSettings[K]
	}

	const record = requireRecord(value, key)

	if (key === "update") {
		readNullableText(record.dismissedVersion, "dismissedVersion")

		if (record.lastCheckedAt !== null) {
			requireNonnegativeNumber(record.lastCheckedAt, "lastCheckedAt")
		}
	} else {
		if (record.version !== 1) {
			throw new Error("Unsupported feedback version")
		}

		readNullableText(record.lastCountedDate, "lastCountedDate")
		requireNonnegativeNumber(record.dayCount, "dayCount")
		requireNonnegativeNumber(record.thresholdIndex, "thresholdIndex")
	}

	return record as DeviceSettings[K]
}

export function readDeviceSetting<K extends keyof DeviceSettings>(key: K): DeviceSettings[K] {
	const saved = deviceStorage.getString(deviceKeys[key])

	return saved === undefined ? defaultDeviceSettings()[key] : parseDeviceSetting(key, saved)
}

export function parseDeviceSetting<K extends keyof DeviceSettings>(key: K, saved: string) {
	return decodeDeviceSetting(
		key,
		key === "locale" || key === "analyticsConsent" ? saved : JSON.parse(saved),
	)
}

export function saveDeviceSetting<K extends keyof DeviceSettings>(
	key: K,
	value: DeviceSettings[K],
) {
	const validated = decodeDeviceSetting(key, value)

	writeVerified(
		deviceStorage,
		deviceKeys[key],
		typeof validated === "string" ? validated : JSON.stringify(validated),
	)
}

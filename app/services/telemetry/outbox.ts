import { storage } from "@/services/storage/data-store"
import { writeVerified } from "@/services/storage/verified-write"
import type { TelemetryEvent } from "@/types/telemetry"
import { requireNonnegativeNumber, requireRecord, requireText } from "@/utils/validation"

export type Properties = Record<string, string | null>

export type Destination = "firebase" | "clarity"

export type PendingEvent = {
	id: string
	order: number
	time: number
	properties: Properties | null
	uid?: string | null
	event: TelemetryEvent | null
	ready: boolean
	delivered: Destination[]
}

const prefix = "buddybird.telemetry.v1/"

function validProperties(value: unknown) {
	return (
		value === null ||
		Object.values(requireRecord(value, "analytics properties")).every(
			(item) => item === null || typeof item === "string",
		)
	)
}

function validParam(value: unknown): boolean {
	return (
		value === null ||
		typeof value === "string" ||
		typeof value === "boolean" ||
		(typeof value === "number" && Number.isFinite(value))
	)
}

export function readOutbox(): PendingEvent[] {
	const entries = storage
		.getAllKeys()
		.filter((key) => key.startsWith(prefix))
		.map((key) => {
			const value = requireRecord(
				JSON.parse(requireText(storage.getString(key), key)),
				"analytics event",
			)
			const id = requireText(value.id, "analytics event ID")

			requireNonnegativeNumber(value.time, "analytics event time")
			requireNonnegativeNumber(value.order, "analytics event order")

			if (
				key !== prefix + id ||
				!Number.isSafeInteger(value.order) ||
				!validProperties(value.properties) ||
				typeof value.ready !== "boolean" ||
				!(value.uid === undefined || value.uid === null || typeof value.uid === "string") ||
				!Array.isArray(value.delivered) ||
				!value.delivered.every((item) => item === "firebase" || item === "clarity")
			) {
				throw new Error("Invalid stored analytics event")
			}

			if (value.event !== null) {
				const event = requireRecord(value.event, "analytics payload")

				requireText(event.name, "analytics name")

				if (
					!Object.values(requireRecord(event.params, "analytics parameters")).every(
						(item) => (Array.isArray(item) ? item.every(validParam) : validParam(item)),
					)
				) {
					throw new Error("Invalid stored analytics parameters")
				}
			}

			return value as PendingEvent
		})

	return entries.sort((a, b) => a.order - b.order)
}

export function saveEvent(entry: PendingEvent) {
	writeVerified(storage, prefix + entry.id, JSON.stringify(entry))
}

export function removeEvent(id: string) {
	const key = prefix + id

	storage.delete(key)

	if (storage.contains(key)) {
		throw new Error("Analytics deletion verification failed")
	}
}

export function clearOutbox() {
	for (const key of storage.getAllKeys()) {
		if (key.startsWith(prefix)) {
			removeEvent(key.slice(prefix.length))
		}
	}
}

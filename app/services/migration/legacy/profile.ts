import type { Profile } from "@/types/profile"
import {
	readNullableText,
	readOptionalText,
	requireNonnegativeNumber,
	requireRecord,
	requireText,
} from "@/utils/validation"

export function parseLegacyProfile(value: unknown): Profile {
	const profileRecord = requireRecord(value, "profile")
	let birthDate =
		profileRecord.birthDate === undefined
			? null
			: readNullableText(profileRecord.birthDate, "birthDate")

	if (profileRecord.birthDate === undefined && profileRecord.ageMonths !== undefined) {
		const date = new Date(requireText(profileRecord.createdAt, "profile.createdAt"))
		const age = requireNonnegativeNumber(profileRecord.ageMonths, "ageMonths")

		if (!Number.isInteger(age) || !Number.isFinite(date.getTime())) {
			throw new Error("Invalid historical profile age")
		}

		const birth = new Date(date.getFullYear(), date.getMonth() - age, 1)

		birthDate = `${birth.getFullYear()}-${String(birth.getMonth() + 1).padStart(2, "0")}-01`
	}

	let species = requireText(profileRecord.species, "species")

	if (species === "parakeet") {
		species = "budgie"
	}

	if (
		species === "custom" &&
		typeof profileRecord.customSpecies === "string" &&
		profileRecord.customSpecies.trim()
	) {
		species = profileRecord.customSpecies.trim()
	}

	return {
		id: requireText(profileRecord.id, "profile.id"),
		name: requireText(profileRecord.name, "profile.name"),
		species,
		birthDate,
		photoUri: readOptionalText(profileRecord.photoUri, "photoUri"),
		createdAt: requireText(profileRecord.createdAt, "createdAt"),
		updatedAt: requireText(profileRecord.updatedAt, "updatedAt"),
	}
}

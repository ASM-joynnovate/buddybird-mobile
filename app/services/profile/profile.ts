import { preservePhoto } from "@/services/media/files"
import { readData, updateData } from "@/services/storage/data-store"
import { Profile } from "@/types/profile"

export async function saveProfile(
	input: Pick<Profile, "name" | "species" | "birthDate" | "photoUri">,
): Promise<Profile> {
	if (!input.name.trim() || !input.species.trim()) {
		throw new Error("Name and species are required")
	}

	if (input.birthDate !== null) {
		const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.birthDate)

		if (!parts) {
			throw new Error("Invalid birth date")
		}

		const [year, month, day] = parts.slice(1).map(Number)
		const date = new Date(year, month - 1, day)

		if (
			date.getFullYear() !== year ||
			date.getMonth() !== month - 1 ||
			date.getDate() !== day ||
			date.getTime() > Date.now()
		) {
			throw new Error("Invalid birth date")
		}
	}

	const previous = readData().profile
	let photoUri = input.photoUri

	if (photoUri && photoUri !== previous?.photoUri && !photoUri.startsWith("photo://")) {
		photoUri = await preservePhoto(photoUri)
	}

	const now = new Date().toISOString()
	const profile: Profile = {
		id: previous?.id ?? `parrot-${now}`,
		createdAt: previous?.createdAt ?? now,
		updatedAt: now,
		name: input.name.trim(),
		species: input.species.trim(),
		birthDate: input.birthDate,
		photoUri,
	}

	updateData((data) => {
		if (previous?.photoUri && previous.photoUri !== photoUri) {
			data.pendingFileDeletes.push(previous.photoUri)
		}

		data.profile = profile
	})

	return profile
}

export function removeProfile() {
	updateData((data) => {
		if (data.profile?.photoUri) {
			data.pendingFileDeletes.push(data.profile.photoUri)
		}

		data.profile = null
	})
}

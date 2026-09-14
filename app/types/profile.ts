export type Profile = {
	id: string
	name: string
	species: string
	birthDate: string | null
	photoUri?: string
	createdAt: string
	updatedAt: string
}

export type ProfileDraft = Pick<Profile, "name" | "species" | "birthDate" | "photoUri">

export type ProfileOnboarding = {
	draft?: ProfileDraft
	onDraft(draft: ProfileDraft): void
	onBack(): void
	onComplete(): void
	onPhotoPickerChange(open: boolean): void
}

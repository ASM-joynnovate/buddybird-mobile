export type Profile = {
	id: string
	name: string
	species: string
	birthDate: string | null
	photoUri?: string
	createdAt: string
	updatedAt: string
}

export type ProfileOnboarding = {
	onBack(): void
	onComplete(): void
	onPhotoPickerChange(open: boolean): void
}

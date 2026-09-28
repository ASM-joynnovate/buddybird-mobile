export async function saveWithPhoto<Saved>({
	photoUri,
	savedPhotoUrl,
	saveInfo,
	uploadPhoto,
	deletePhoto,
	onDone,
}: {
	photoUri: string | null;
	savedPhotoUrl: string | null;
	saveInfo(): Promise<Saved>;
	uploadPhoto(saved: Saved, uri: string): Promise<unknown>;
	deletePhoto(saved: Saved): Promise<unknown>;
	onDone(): void;
}): Promise<void> {
	const saved = await saveInfo();

	if (photoUri && photoUri !== savedPhotoUrl) {
		await uploadPhoto(saved, photoUri);
	} else if (!photoUri && savedPhotoUrl) {
		await deletePhoto(saved);
	}

	onDone();
}

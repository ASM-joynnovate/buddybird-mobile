import { type Upload, uploadSchema } from '@/types/apis/uploads';

import { mockServer } from '@/mocks/server';

export const putUserPhotoUpload = async ({ idempotencyKey }: { idempotencyKey: string }): Promise<Upload> => {
	return uploadSchema.parse(await mockServer.users.issuePhotoUpload());
};

export const putParrotPhotoUpload = async ({
	id,
	idempotencyKey,
}: {
	id: string;
	idempotencyKey: string;
}): Promise<Upload> => {
	return uploadSchema.parse(await mockServer.parrots.issuePhotoUpload(id));
};

export const postWordRecordingUpload = async ({
	id,
	idempotencyKey,
}: {
	id: string;
	idempotencyKey: string;
}): Promise<Upload> => {
	return uploadSchema.parse(await mockServer.words.issueRecordingUpload(id));
};

export const postSessionSoundUpload = async ({
	id,
	data,
	idempotencyKey,
}: {
	id: string;
	data: { captured_at: string };
	idempotencyKey: string;
}): Promise<Upload> => {
	return uploadSchema.parse(await mockServer.sessions.issueSoundUpload(id, data.captured_at));
};

export const putUploadFile = async ({ upload, uri }: { upload: Upload; uri: string }): Promise<void> => {
	await mockServer.uploads.put(upload.file_id, uri);
};

import { type Upload, uploadSchema, type WordRecordingUpload, wordRecordingUploadSchema } from '@/types/apis/uploads';

import { apiRequest } from '@/lib/api';

import { File } from 'expo-file-system';

import { API_TIMEOUT_MS } from '@/config';

export const putUserPhotoUpload = async ({
	uri,
	idempotencyKey,
}: {
	uri: string;
	idempotencyKey: string;
}): Promise<Upload> => {
	const file = new File(uri);

	const { data: upload } = await apiRequest('/api/v1/users/me/photo', uploadSchema, {
		method: 'PUT',
		json: { content_type: file.type, file_size: file.size },
		idempotencyKey,
	});

	return upload;
};

export const putParrotPhotoUpload = async ({
	id,
	uri,
	idempotencyKey,
}: {
	id: string;
	uri: string;
	idempotencyKey: string;
}): Promise<Upload> => {
	const file = new File(uri);

	const { data: upload } = await apiRequest(`/api/v1/parrots/${id}/photo`, uploadSchema, {
		method: 'PUT',
		json: { content_type: file.type, file_size: file.size },
		idempotencyKey,
	});

	return upload;
};

export const postWordRecordingUpload = async ({
	id,
	uri,
	idempotencyKey,
}: {
	id: string;
	uri: string;
	idempotencyKey: string;
}): Promise<WordRecordingUpload> => {
	const file = new File(uri);

	const { data: upload } = await apiRequest(`/api/v1/words/${id}/recordings`, wordRecordingUploadSchema, {
		method: 'POST',
		json: { content_type: 'audio/mp4', file_size: file.size },
		idempotencyKey,
	});

	return upload;
};

export const postSessionSoundUpload = async ({
	id,
	uri,
	data,
	idempotencyKey,
}: {
	id: string;
	uri: string;
	data: { captured_at: string };
	idempotencyKey: string;
}): Promise<Upload> => {
	const file = new File(uri);

	const { data: upload } = await apiRequest(`/api/v1/sessions/${id}/sounds`, uploadSchema, {
		method: 'POST',
		json: { content_type: 'audio/wav', file_size: file.size, captured_at: data.captured_at },
		idempotencyKey,
	});

	return upload;
};

export const putUploadFile = async ({ upload, uri }: { upload: Upload; uri: string }): Promise<void> => {
	const response = await fetch(upload.url, {
		method: 'PUT',
		headers: upload.headers,
		body: await new File(uri).bytes(),
		signal: AbortSignal.timeout(API_TIMEOUT_MS),
	});

	if (!response.ok) {
		throw new Error(`Upload failed (HTTP ${response.status})`);
	}
};

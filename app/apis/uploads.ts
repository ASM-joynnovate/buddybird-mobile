import type { PetcamEventKind } from '@/types/apis/sessions';
import {
	type PetcamEventUpload,
	petcamEventUploadSchema,
	type Upload,
	uploadSchema,
	type WordRecordingUpload,
	wordRecordingUploadSchema,
} from '@/types/apis/uploads';

import { apiRequest } from '@/lib/api';

import { File } from 'expo-file-system';

import { API_TIMEOUT_MS } from '@/config';

const SUCCESS_STATUS_MIN = 200;
const SUCCESS_STATUS_MAX = 299;

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

export const postSessionPetcamEventUpload = async ({
	id,
	uri,
	data,
	idempotencyKey,
}: {
	id: string;
	uri: string;
	data: { kind: PetcamEventKind; occurred_at: string };
	idempotencyKey: string;
}): Promise<PetcamEventUpload> => {
	const file = new File(uri);

	const { data: upload } = await apiRequest(`/api/v1/sessions/${id}/petcam-events`, petcamEventUploadSchema, {
		method: 'POST',
		json: { kind: data.kind, occurred_at: data.occurred_at, file_size: file.size },
		idempotencyKey,
	});

	return upload;
};

export const postSessionPetcamVideoUpload = async ({
	id,
	eventId,
	uri,
	idempotencyKey,
}: {
	id: string;
	eventId: string;
	uri: string;
	idempotencyKey: string;
}): Promise<Upload> => {
	const file = new File(uri);

	const { data: upload } = await apiRequest(`/api/v1/sessions/${id}/petcam-events/${eventId}/video`, uploadSchema, {
		method: 'POST',
		json: { file_size: file.size },
		idempotencyKey,
	});

	return upload;
};

export const putUploadFile = async ({
	upload,
	uri,
	timeoutMs = API_TIMEOUT_MS,
}: {
	upload: Upload;
	uri: string;
	timeoutMs?: number;
}): Promise<void> => {
	const result = await new File(uri).upload(upload.url, {
		httpMethod: 'PUT',
		headers: upload.headers,
		sessionType: 'foreground',
		signal: AbortSignal.timeout(timeoutMs),
	});

	if (result.status < SUCCESS_STATUS_MIN || result.status > SUCCESS_STATUS_MAX) {
		throw new Error(`Upload failed (HTTP ${result.status})`);
	}
};

import type { SessionPetcamVideoParams, SessionSoundParams } from '@/types/apis/sessions';
import {
	type FileUploadParams,
	type IdFileUploadParams,
	type PetcamEventUpload,
	petcamEventUploadSchema,
	type PostSessionPetcamEventUploadParams,
	type PutUploadFileParams,
	type Upload,
	uploadSchema,
	type WordRecordingUpload,
	wordRecordingUploadSchema,
} from '@/types/apis/uploads';

import { apiRequest } from '@/lib/api';

import { File } from 'expo-file-system';

import { API_TIMEOUT_MS } from '@/config/policy';

const SUCCESS_STATUS_MIN = 200;
const SUCCESS_STATUS_MAX = 299;

const putPhotoUpload = async ({ path, uri, idempotencyKey }: FileUploadParams & { path: string }): Promise<Upload> => {
	const file = new File(uri);

	const { data: upload } = await apiRequest(path, uploadSchema, {
		method: 'PUT',
		json: { content_type: file.type, file_size: file.size },
		idempotencyKey,
	});

	return upload;
};

export const putUserPhotoUpload = ({ uri, idempotencyKey }: FileUploadParams): Promise<Upload> =>
	putPhotoUpload({ path: '/api/v1/users/me/photo', uri, idempotencyKey });

export const putParrotPhotoUpload = ({ id, uri, idempotencyKey }: IdFileUploadParams): Promise<Upload> =>
	putPhotoUpload({ path: `/api/v1/parrots/${id}/photo`, uri, idempotencyKey });

export const postWordRecordingUpload = async ({
	id,
	uri,
	idempotencyKey,
}: IdFileUploadParams): Promise<WordRecordingUpload> => {
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
}: SessionSoundParams): Promise<Upload> => {
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
}: PostSessionPetcamEventUploadParams): Promise<PetcamEventUpload> => {
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
}: SessionPetcamVideoParams): Promise<Upload> => {
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
}: PutUploadFileParams): Promise<void> => {
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

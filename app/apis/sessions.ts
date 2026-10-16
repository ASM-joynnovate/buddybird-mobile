import { postSessionPetcamVideoUpload, postSessionSoundUpload, putUploadFile } from '@/apis/uploads';

import { type Page, pageMetaSchema } from '@/types/apis/common';
import {
	type Heartbeat,
	type HeartbeatRequest,
	heartbeatSchema,
	type Session,
	type SessionEvent,
	sessionEventListSchema,
	sessionSchema,
	type SessionSound,
	sessionSoundSchema,
	type SessionSummary,
	sessionSummarySchema,
	type StartSessionRequest,
} from '@/types/apis/sessions';

import { apiRequest } from '@/lib/api';

import { z } from 'zod';

import { API_TIMEOUT_MS, PETCAM_VIDEO_UPLOAD_TIMEOUT_MS } from '@/config';
import { SECOND } from '@/config/units';

const SOUND_PAGE_SIZE = 50;
const WAV_HEADER_BYTES = 44;
const WAV_BYTE_RATE_OFFSET = 28;

const getSessionList = async ({ page }: { page: number }): Promise<Page<Session>> => {
	const { data, meta } = await apiRequest('/api/v1/sessions', z.array(sessionSchema), { searchParams: { page } });

	return { data, meta: pageMetaSchema.parse(meta) };
};

export const getRunningSession = async (): Promise<Session | null> => {
	const { data: sessions } = await getSessionList({ page: 1 });

	return sessions.find((session) => session.status === 'running') ?? null;
};

export const getSession = async ({ id }: { id: string }): Promise<Session> => {
	const { data: session } = await apiRequest(`/api/v1/sessions/${id}`, sessionSchema);

	return session;
};

export const getSessionSummary = async ({ id }: { id: string }): Promise<SessionSummary> => {
	const { data: sessionSummary } = await apiRequest(`/api/v1/sessions/${id}/summary`, sessionSummarySchema);

	return sessionSummary;
};

export const postSession = async ({
	data,
	idempotencyKey,
}: {
	data: StartSessionRequest;
	idempotencyKey: string;
}): Promise<Session> => {
	const { data: session } = await apiRequest('/api/v1/sessions', sessionSchema, {
		method: 'POST',
		json: data,
		idempotencyKey,
	});

	return session;
};

export const postSessionFinish = async ({
	id,
	idempotencyKey,
}: {
	id: string;
	idempotencyKey: string;
}): Promise<Session> => {
	const { data: session } = await apiRequest(`/api/v1/sessions/${id}/finish`, sessionSchema, {
		method: 'POST',
		idempotencyKey,
	});

	return session;
};

export const postRunningSessionFinish = async ({ idempotencyKey }: { idempotencyKey: string }): Promise<void> => {
	const runningSession = await getRunningSession();

	if (runningSession) {
		await postSessionFinish({ id: runningSession.id, idempotencyKey });
	}
};

export const postSessionHeartbeat = async ({
	id,
	data,
	idempotencyKey,
}: {
	id: string;
	data: HeartbeatRequest;
	idempotencyKey: string;
}): Promise<Heartbeat> => {
	const { data: heartbeat } = await apiRequest(`/api/v1/sessions/${id}/heartbeat`, heartbeatSchema, {
		method: 'POST',
		json: data,
		idempotencyKey,
	});

	return heartbeat;
};

export const postSessionSound = async ({
	id,
	uri,
	data,
	idempotencyKey,
}: {
	id: string;
	uri: string;
	data: { captured_at: string };
	idempotencyKey: string;
}): Promise<void> => {
	await putUploadFile({ upload: await postSessionSoundUpload({ id, uri, data, idempotencyKey }), uri });
};

export const getSessionSoundList = async ({ id, page }: { id: string; page: number }): Promise<Page<SessionSound>> => {
	const { data, meta } = await apiRequest(`/api/v1/sessions/${id}/sounds`, z.array(sessionSoundSchema), {
		searchParams: { page, count_by_page: SOUND_PAGE_SIZE },
	});

	return { data, meta: pageMetaSchema.parse(meta) };
};

export const getSessionEventList = async ({ id }: { id: string }): Promise<SessionEvent[]> => {
	const { data: sessionEvents } = await apiRequest(`/api/v1/sessions/${id}/events`, sessionEventListSchema, {
		searchParams: { petcam: true },
	});

	return sessionEvents;
};

export const postSessionPetcamVideo = async ({
	id,
	eventId,
	uri,
	idempotencyKey,
}: {
	id: string;
	eventId: string;
	uri: string;
	idempotencyKey: string;
}): Promise<void> => {
	await putUploadFile({
		upload: await postSessionPetcamVideoUpload({ id, eventId, uri, idempotencyKey }),
		uri,
		timeoutMs: PETCAM_VIDEO_UPLOAD_TIMEOUT_MS,
	});
};

export const getSessionSoundDuration = async ({ url }: { url: string }): Promise<number> => {
	const response = await fetch(url, {
		headers: { Range: `bytes=0-${WAV_HEADER_BYTES - 1}` },
		signal: AbortSignal.timeout(API_TIMEOUT_MS),
	});
	const fileSize = Number(response.headers.get('Content-Range')?.split('/').at(1));

	if (!response.ok || !Number.isFinite(fileSize)) {
		throw new Error(`Sound header request failed (HTTP ${response.status})`);
	}

	const byteRate = new DataView(await response.arrayBuffer()).getUint32(WAV_BYTE_RATE_OFFSET, true);

	if (byteRate === 0) {
		throw new Error('Sound header is invalid');
	}

	return Math.round(((fileSize - WAV_HEADER_BYTES) / byteRate) * SECOND);
};

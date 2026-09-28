import { postSessionSoundUpload, putUploadFile } from '@/apis/uploads';

import { type Page, pageMetaSchema } from '@/types/apis/common';
import {
	type Heartbeat,
	type HeartbeatRequest,
	heartbeatSchema,
	type Session,
	sessionSchema,
	type SessionSound,
	sessionSoundSchema,
	type StartSessionRequest,
} from '@/types/apis/sessions';

import { z } from 'zod';

import { mockServer } from '@/mocks/server';

const getSessionList = async ({ page }: { page: number }): Promise<Page<Session>> => {
	const { data, meta } = await mockServer.sessions.list(page);

	return { data: z.array(sessionSchema).parse(data), meta: pageMetaSchema.parse(meta) };
};

export const getRunningSession = async (): Promise<Session | null> => {
	const { data: sessions } = await getSessionList({ page: 1 });

	return sessions.find((session) => session.status === 'running') ?? null;
};

export const getSession = async ({ id }: { id: string }): Promise<Session> => {
	return sessionSchema.parse(await mockServer.sessions.detail(id));
};

export const postSession = async ({
	data,
	idempotencyKey,
}: {
	data: StartSessionRequest;
	idempotencyKey: string;
}): Promise<Session> => {
	return sessionSchema.parse(await mockServer.sessions.start(data));
};

export const postSessionFinish = async ({
	id,
	idempotencyKey,
}: {
	id: string;
	idempotencyKey: string;
}): Promise<Session> => {
	return sessionSchema.parse(await mockServer.sessions.finish(id));
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
	return heartbeatSchema.parse(await mockServer.sessions.heartbeat(id, data));
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
	await putUploadFile({ upload: await postSessionSoundUpload({ id, data, idempotencyKey }), uri });
};

export const getSessionSoundList = async ({ id, page }: { id: string; page: number }): Promise<Page<SessionSound>> => {
	const { data, meta } = await mockServer.sessions.sounds(id, page);

	return { data: z.array(sessionSoundSchema).parse(data), meta: pageMetaSchema.parse(meta) };
};

export const getAllSessionSounds = async ({ id }: { id: string }): Promise<SessionSound[]> => {
	let sounds: SessionSound[] = [];

	for (let pageNumber = 1; ; pageNumber++) {
		const soundPage = await getSessionSoundList({ id, page: pageNumber });

		sounds = sounds.concat(soundPage.data);

		if (soundPage.meta.is_last) {
			return sounds;
		}
	}
};

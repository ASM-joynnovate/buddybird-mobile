import { Platform } from 'react-native';

import type { NotificationKind } from '@/types/apis/notifications';

import { Asset } from 'expo-asset';
import { randomUUID } from 'expo-crypto';

import { phaseSpans } from '@/mocks/phases';
import { DAY, HOUR, MINUTE } from '@/utils/units';

export type Ref = { id: string; name: string };

export type MockSound = {
	id: string;
	session_id: string;
	captured_at: string;
	audio_url: string;
	analyzed: boolean;
	word_id: string | null;
	is_parrot_sound: boolean | null;
	score: number | null;
	feedback: 'up' | 'down' | null;
};

export type MockEvent = {
	id: string;
	kind: string;
	occurred_at: string;
	word_id: string | null;
};

export type MockSleepEvent = {
	id: string;
	kind: 'sleep_started' | 'sleep_finished';
	occurred_at: string;
};

export type MockSession = {
	id: string;
	status: 'running' | 'finished';
	started_at: string;
	ended_at: string | null;
	ended_by: 'user' | 'server' | null;
	word_id: string | null;
	learning_enabled: boolean;
	station_device_id: string;
	settings_version: number;
	applied_settings_version: number;
	last_heartbeat_at: string | null;
	ends_at: string | null;
	sleep: MockSettings['sleep'] | null;
	summaries: MockSummary[];
	events: MockEvent[];
	sleep_events: MockSleepEvent[];
	sounds: MockSound[];
	activity: { at: string; level: number }[];
};

export type MockSummary = {
	word_id: string;
	local_date: string;
	play_count: number;
	play_duration_ms: number;
	learning_duration_ms?: number;
};

export type MockRecording = {
	id: string;
	url: string;
	duration_ms: number;
	status: 'processing' | 'ready';
	created_at: string;
};

export type MockWord = { id: string; name: string; recordings: MockRecording[] };

export type MockDevice = {
	id: string;
	client_device_id: string;
	timezone: string | null;
	last_seen_at: string | null;
	client: { platform: string; os_version: string; model: string; app_version: string };
	push_registered: boolean;
};

export type MockNotification = {
	id: string;
	kind: NotificationKind;
	title: string;
	body: string;
	image: { url: string } | null;
	sound_id: string | null;
	report_date: string | null;
	sent_at: string;
	read_at: string | null;
	session_id: string | null;
};

export type MockNotice = {
	id: string;
	title: string;
	body: string | null;
	starts_at: string;
	ends_at: string | null;
	images: { id: string; url: string }[];
	is_read: boolean;
};

export type MockSettings = {
	sleep: { sleep_at: string; wake_at: string };
	notifications: {
		notice: boolean;
		report: boolean;
		marketing: boolean;
	};
};

export type MockProvider = 'google' | 'kakao' | 'apple';

export type MockText = { 'ko-KR': string; 'en-US': string };

export type MockLocale = keyof MockText;

export type MockConsent = {
	id: string;
	kind: string;
	version: number;
	title: MockText;
	body: MockText;
	is_required: boolean;
	published_at: string;
	status: 'granted' | 'denied' | null;
};

export type MockParrot = {
	id: string;
	name: string;
	species: string;
	birthdate: string | null;
	photo: { url: string } | null;
};

export type Database = {
	user: {
		id: string;
		email: string | null;
		nickname: string | null;
		photo: { url: string } | null;
	};
	settings: MockSettings;
	consents: MockConsent[];
	parrots: MockParrot[];
	words: MockWord[];
	devices: MockDevice[];
	currentDeviceId: string;
	sessions: MockSession[];
	notices: MockNotice[];
	notifications: MockNotification[];
};

export const iso = (at: number) => new Date(at).toISOString();

const assetUri = (module: number) => Asset.fromModule(module).uri;

const clips = {
	hello: assetUri(require('@assets/audio/mock/default_An-nyeong.m4a') as number),
	love: assetUri(require('@assets/audio/mock/default_Sa-rang-hae.m4a') as number),
	bye: assetUri(require('@assets/audio/mock/default_Da-nyeo-wa.m4a') as number),
	apple: assetUri(require('@assets/audio/mock/default_Sa-gwa.m4a') as number),
};

export const sampleImage = assetUri(require('@assets/images/buddy-bird.png') as number);

function seeded(initial: number) {
	let state = initial;

	return () => {
		state = (state + 0x6d2b79f5) | 0;

		let value = Math.imul(state ^ (state >>> 15), 1 | state);

		value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;

		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

const random = seeded(20260921);
const between = (min: number, max: number) => min + (max - min) * random();
const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)];

function word(name: string, urls: string[], createdAt: number): MockWord {
	return {
		id: randomUUID(),
		name,
		recordings: urls.map((url, index) => ({
			id: randomUUID(),
			url,
			duration_ms: Math.round(between(900, 1800)),
			status: 'ready',
			created_at: iso(createdAt + index * MINUTE),
		})),
	};
}

type Learning = Pick<MockSession, 'started_at' | 'ended_at' | 'learning_enabled'>;

export type SleepWindow = { sleep_at: string; wake_at: string };

export function sleepWindowOf(settings: MockSettings): SleepWindow {
	return settings.sleep;
}

export function learningMsBetween(session: Learning, window: SleepWindow, from: number, to: number, now: number) {
	if (!session.learning_enabled) {
		return 0;
	}

	const start = Date.parse(session.started_at);
	const end = session.ended_at ? Date.parse(session.ended_at) : now;

	return phaseSpans(start, Math.min(end, to), window)
		.filter((span) => span.phase === 'learning')
		.reduce((sum, span) => sum + Math.max(0, Math.min(span.end, to) - Math.max(span.start, from)), 0);
}

export function plays(learningMs: number) {
	const count = Math.floor(learningMs / 6000);

	return { play_count: count, play_duration_ms: count * 1500 };
}

function sounds(sessionId: string, start: number, end: number, target: Ref | null, now: number): MockSound[] {
	const count = Math.max(1, Math.round(((end - start) / HOUR) * between(0.6, 1.6)));

	return Array.from({ length: count }, (): MockSound => {
		const captured = between(start + 5 * MINUTE, end - MINUTE);
		const age = now - captured;
		const analyzed = age > 20 * MINUTE || random() > 0.5;
		const mimicked = analyzed && target !== null && random() > 0.45;

		return {
			id: randomUUID(),
			session_id: sessionId,
			captured_at: iso(captured),
			audio_url: pick(Object.values(clips)),
			analyzed,
			word_id: mimicked && target ? target.id : null,
			is_parrot_sound: analyzed ? true : null,
			score: mimicked ? between(0.42, 0.98) : null,
			feedback: null,
		};
	}).sort((a, b) => Date.parse(a.captured_at) - Date.parse(b.captured_at));
}

function activity(start: number, end: number) {
	const points = [];

	for (let at = start; at < end; at += 10 * MINUTE) {
		points.push({
			at: iso(at),
			level: Math.min(1, between(0.08, 0.55) + (random() > 0.85 ? 0.4 : 0)),
		});
	}

	return points;
}

export function event(kind: string, at: number, extra: Partial<MockEvent> = {}): MockEvent {
	return {
		id: randomUUID(),
		kind,
		occurred_at: iso(at),
		word_id: null,
		...extra,
	};
}

function createSleepEvent(kind: MockSleepEvent['kind'], at: number): MockSleepEvent {
	return { id: randomUUID(), kind, occurred_at: iso(at) };
}

function events(session: MockSession, now: number): MockEvent[] {
	const start = Date.parse(session.started_at);
	const end = session.ended_at ? Date.parse(session.ended_at) : now;
	const list = [event('session_started', start)];

	if (session.learning_enabled && session.word_id) {
		list.push(event('learning_started', start + 1000, { word_id: session.word_id }));
	}

	if (end - start > 4 * HOUR && random() > 0.7) {
		const lost = between(start + HOUR, end - 2 * HOUR);

		list.push(event('station_disconnected', lost), event('station_reconnected', lost + between(3, 25) * MINUTE));
	}

	if (session.ended_at) {
		list.push(event('session_finished', end));
	}

	return list.sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at));
}

export function sleepEvents(
	session: Pick<MockSession, 'started_at' | 'ended_at'>,
	window: SleepWindow,
	now: number,
): MockSleepEvent[] {
	const start = Date.parse(session.started_at);
	const end = session.ended_at ? Date.parse(session.ended_at) : now;
	const spans = phaseSpans(start, end, window);

	return spans.flatMap((span, index) => {
		if (span.phase !== 'sleeping') {
			return [];
		}

		return index < spans.length - 1
			? [createSleepEvent('sleep_started', span.start), createSleepEvent('sleep_finished', span.end)]
			: [createSleepEvent('sleep_started', span.start)];
	});
}

function buildSession(
	options: {
		start: number;
		end: number | null;
		word: Ref | null;
		stationId: string;
		settings: MockSettings;
		endedBy: 'user' | 'server';
	},
	now: number,
): MockSession {
	const id = randomUUID();
	const running = options.end === null;
	const end = options.end ?? now;
	const record: MockSession = {
		id,
		status: running ? 'running' : 'finished',
		started_at: iso(options.start),
		ended_at: running ? null : iso(end),
		ended_by: running ? null : options.endedBy,
		word_id: options.word?.id ?? null,
		learning_enabled: options.word !== null,
		station_device_id: options.stationId,
		settings_version: 1,
		applied_settings_version: 1,
		last_heartbeat_at: iso(running ? now - 4000 : end),
		ends_at: null,
		sleep: null,
		summaries: [],
		events: [],
		sleep_events: [],
		sounds: sounds(id, options.start, end, options.word, now),
		activity: activity(options.start, end),
	};

	return {
		...record,
		events: events(record, now),
		sleep_events: sleepEvents(record, sleepWindowOf(options.settings), now),
	};
}

function startOfDay(at: number) {
	const date = new Date(at);

	date.setHours(0, 0, 0, 0);

	return date.getTime();
}

function dateKey(at: number) {
	const date = new Date(at);

	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function notification(
	kind: NotificationKind,
	title: string,
	body: string,
	sentAt: number,
	extra: Partial<MockNotification> = {},
): MockNotification {
	return {
		id: randomUUID(),
		kind,
		title,
		body,
		image: null,
		sound_id: null,
		report_date: null,
		sent_at: iso(sentAt),
		read_at: null,
		session_id: null,
		...extra,
	};
}

function createDevice(client: MockDevice['client'], lastSeenAt: number): MockDevice {
	return {
		id: randomUUID(),
		client_device_id: randomUUID(),
		timezone: 'Asia/Seoul',
		last_seen_at: iso(lastSeenAt),
		client,
		push_registered: true,
	};
}

const consents = [
	{
		kind: 'terms',
		title: { 'ko-KR': '서비스 이용약관', 'en-US': 'Terms of Service' },
		body: {
			'ko-KR':
				'제1조 목적\n이 약관은 버디버드 서비스의 이용 조건과 절차를 정합니다.\n\n제2조 서비스 내용\n버디버드는 사용자가 집을 비운 동안 앵무새에게 단어를 들려주고, 앵무새가 낸 소리와 응급 상황을 기록합니다.\n\n제3조 계정\n사용자는 소셜 로그인으로 계정을 만들고, 같은 계정으로 로그인한 기기를 함께 사용합니다.',
			'en-US':
				'Article 1 Purpose\nThese terms set the conditions and procedures for using BuddyBird.\n\nArticle 2 Service\nBuddyBird plays words to your parrot while you are away and records the sounds and emergencies it detects.\n\nArticle 3 Account\nYou create an account with social login and use every device signed in to the same account.',
		},
		is_required: true,
	},
	{
		kind: 'privacy',
		title: {
			'ko-KR': '개인정보 수집 및 이용',
			'en-US': 'Collection and Use of Personal Information',
		},
		body: {
			'ko-KR':
				'수집 항목\n이메일, 닉네임, 기기 정보\n\n이용 목적\n계정 확인과 기기 연결\n\n보관 기간\n회원 탈퇴 시까지',
			'en-US':
				'Collected items\nEmail, nickname, device information\n\nPurpose\nAccount verification and device linking\n\nRetention\nUntil you delete your account',
		},
		is_required: true,
	},
	{
		kind: 'media',
		title: { 'ko-KR': '영상과 음성 수집', 'en-US': 'Video and Audio Collection' },
		body: {
			'ko-KR':
				'새장 앞 기기의 카메라와 마이크로 수집한 영상과 음성을 서버에 저장합니다.\n\n응급 상황 기록은 30일 뒤 자동으로 삭제하고, 회원 탈퇴 시 모든 기록을 함께 삭제합니다.',
			'en-US':
				'We store video and audio captured by the camera and microphone of the device by the cage.\n\nEmergency recordings are deleted automatically after 30 days, and every record is deleted when you delete your account.',
		},
		is_required: true,
	},
	{
		kind: 'marketing',
		title: {
			'ko-KR': '새 기능과 이벤트 소식 받기',
			'en-US': 'News about New Features and Events',
		},
		body: {
			'ko-KR': '새 기능과 이벤트 소식을 알림으로 보내 드립니다. 설정에서 언제든 철회할 수 있습니다.',
			'en-US': 'We send notifications about new features and events. You can withdraw anytime in Settings.',
		},
		is_required: false,
	},
];

function defaultSettings(): MockSettings {
	return {
		sleep: { sleep_at: '20:00:00', wake_at: '08:00:00' },
		notifications: {
			notice: true,
			report: true,
			marketing: true,
		},
	};
}

function presetWords(created: number): MockWord[] {
	return [
		word('안녕', [clips.hello], created),
		word('사랑해', [clips.love], created),
		word('다녀와', [clips.bye], created),
	];
}

function currentDevice(now: number): MockDevice {
	return createDevice(
		Platform.OS === 'ios'
			? { platform: 'ios', os_version: '18.0', model: 'iPhone 15', app_version: '1.2.0' }
			: { platform: 'android', os_version: '15', model: 'Pixel 8', app_version: '1.2.0' },
		now,
	);
}

function createConsents(created: number): MockConsent[] {
	return consents.map((item) => ({
		...item,
		id: randomUUID(),
		version: 1,
		published_at: iso(created),
		status: null,
	}));
}

function createNotices(now: number): Pick<Database, 'notices'> {
	const notices: MockNotice[] = [
		{
			id: randomUUID(),
			title: '버디버드가 새로워졌어요',
			body: '이제 집에 둔 기기로 세션을 실행하고, 들고 다니는 기기로 앵무새를 확인할 수 있어요.\n\n응급 상황을 감지하면 바로 알려 드리고, 앵무새가 따라 한 단어도 모아서 보여 드려요.',
			starts_at: iso(now - 2 * DAY),
			ends_at: null,
			images: [{ id: randomUUID(), url: sampleImage }],
			is_read: false,
		},
		{
			id: randomUUID(),
			title: '추석 연휴 고객센터 운영 안내',
			body: '연휴 동안 문의 답변이 늦어질 수 있어요. 앱의 피드백 보내기로 남겨 주시면 순서대로 답변드릴게요.',
			starts_at: iso(now - 9 * DAY),
			ends_at: null,
			images: [],
			is_read: true,
		},
	];

	return { notices };
}

export function newDatabase(now: number): Database {
	const current = currentDevice(now);

	return {
		user: { id: randomUUID(), email: null, nickname: null, photo: null },
		settings: defaultSettings(),
		consents: createConsents(now),
		parrots: [],
		words: presetWords(now),
		devices: [current],
		currentDeviceId: current.id,
		sessions: [],
		...createNotices(now),
		notifications: [],
	};
}

export function seed(now: number): Database {
	const settings = defaultSettings();
	const created = now - 60 * DAY;
	const words = [
		...presetWords(created),
		word('초코야', [clips.hello, clips.love, clips.bye, clips.apple, clips.hello], created),
	];
	const refs = words.map((item) => ({ id: item.id, name: item.name }));
	const station = createDevice(
		{ platform: 'android', os_version: '14', model: 'Galaxy S21', app_version: '1.2.0' },
		now - 4000,
	);
	const current = currentDevice(now);
	const sessions: MockSession[] = [];
	const today = startOfDay(now);

	for (let daysAgo = 44; daysAgo >= 1; daysAgo--) {
		if (random() < 0.35 && daysAgo > 3) {
			continue;
		}

		const start = today - daysAgo * DAY + between(8.3, 9.6) * HOUR;
		const long = daysAgo === 20;

		sessions.push(
			buildSession(
				{
					start,
					end: start + (long ? 52 * HOUR : between(6, 11) * HOUR),
					word: random() > 0.12 ? pick(refs) : null,
					stationId: station.id,
					settings,
					endedBy: random() > 0.92 ? 'server' : 'user',
				},
				now,
			),
		);

		if (long) {
			daysAgo -= 2;
		}
	}

	const running = buildSession(
		{
			start: now - (3 * HOUR + 12 * MINUTE),
			end: null,
			word: refs[0],
			stationId: station.id,
			settings,
			endedBy: 'user',
		},
		now,
	);

	sessions.push(running);

	const latest = [...running.sounds].reverse().find((item) => item.word_id);
	const latestWord = words.find((item) => item.id === latest?.word_id);
	const reportDate = dateKey(today - DAY);
	const notifications = [
		...(latest && latestWord
			? [
					notification(
						'mimicry',
						`앵무새가 "${latestWord.name}"를 따라 했어요`,
						'녹음을 들어 보고 맞았는지 알려 주세요.',
						Date.parse(latest.captured_at) + MINUTE,
						{ session_id: latest.session_id, sound_id: latest.id },
					),
				]
			: []),
		notification(
			'daily_summary',
			'어제의 학습 요약',
			'어제 앵무새에게 들려준 단어와 횟수를 확인해 보세요.',
			today - 3 * HOUR,
			{ report_date: reportDate, read_at: iso(today) },
		),
		notification(
			'streak',
			'3일 연속 학습했어요',
			'앵무새와 꾸준히 연습하고 있어요. 리포트에서 추이를 확인해 보세요.',
			today - DAY - 2 * HOUR,
			{ report_date: reportDate, read_at: iso(today - DAY) },
		),
	].sort((a, b) => Date.parse(b.sent_at) - Date.parse(a.sent_at));

	return {
		user: {
			id: randomUUID(),
			email: 'choco.papa@example.com',
			nickname: '초코아빠',
			photo: null,
		},
		settings,
		consents: createConsents(created),
		parrots: [],
		words,
		devices: [current, station],
		currentDeviceId: current.id,
		sessions,
		...createNotices(now),
		notifications,
	};
}

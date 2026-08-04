// flush 오케스트레이터(requestWordUpload·requestWordUploadFlush)의 시나리오 테스트.
// I/O 협력자(스토어·클라이언트·게이트 입력)는 mock, 판정 모듈(gate·target·response)은 실제 구현을 쓴다.
//
// 모듈이 flushInFlight·queuedTarget 을 전역으로 들고 있어 테스트마다 그래프를 새로 로드한다 —
// 남은 in-flight 상태는 다음 테스트를 조용히 no-op 으로 만들고, 그래도 통과해버린다.

import { createWordEntry } from '../word-library-model';
import type { WordEntry } from '../word-library-types';

jest.mock('@/features/analytics/error-reporter', () => ({ reportError: jest.fn() }));
jest.mock('@/features/audio/audio-file-storage', () => ({
  hydrateAudioUriFromStorage: jest.fn(),
  recordingFileExists: jest.fn(),
}));
jest.mock('@/features/auth/auth-identity', () => ({ getCurrentUid: jest.fn() }));
jest.mock('@/features/shared/expo-extra', () => ({ readExtraString: jest.fn() }));
jest.mock('@/features/upload-consent/upload-consent-storage', () => ({ loadUploadConsent: jest.fn() }));
jest.mock('../word-library-storage', () => ({ loadWordLibraryStore: jest.fn() }));
jest.mock('../word-upload-client', () => ({ sendWord: jest.fn() }));

const API_BASE_URL = 'https://api.buddybird.app';
const FIREBASE_ANON_UID = 'Xj2mQ8pLd0Zb7Nf4Rk1Ts6Vy9Cw3';
const RECORDINGS_DIRECTORY =
  'file:///var/mobile/Containers/Data/Application/6F3C1E1A-2B77-4E5D-9C42-8D0B5A9E7C31/Documents/recordings';
const CREATED_FIRST = '2026-08-01T09:14:32.118Z';
const CREATED_SECOND = '2026-08-02T20:37:05.441Z';
const CREATED_THIRD = '2026-08-03T18:41:09.552Z';

// 진입점이 fire-and-forget 이라 완료를 직접 기다릴 수 없다. 협력자가 전부 mock(즉시 resolve)이라
// 체인은 microtask 뿐이고, macrotask 경계 하나면 재실행 예약(queuedTarget)까지 소진된다.
const drainFlush = (): Promise<void> => new Promise((resolve) => { setTimeout(resolve, 0); });

function recordingFileName(createdAt: string): string {
  return `recording-${createdAt.replace(/[:.]/g, '-')}.m4a`;
}

function recordedWord(label: string, createdAt: string): WordEntry {
  return createWordEntry(
    { label, tag: 'greeting', sourceType: 'recording', audioUri: `recording://${recordingFileName(createdAt)}` },
    createdAt,
  );
}

function presetWord(presetKey: string, label: string, createdAt: string): WordEntry {
  return createWordEntry(
    { label, tag: 'greeting', sourceType: 'preset', presetKey, audioUri: `preset://${label}` },
    createdAt,
  );
}

type Harness = ReturnType<typeof loadHarness>;

// 모듈 그래프를 새로 만들고 기본 상태(동의 granted·uid·baseUrl·파일 존재)를 세운다.
// Platform 은 리셋된 레지스트리의 인스턴스를 덮어야 오케스트레이터가 그 값을 본다.
function loadHarness(platformOS: 'ios' | 'android' | 'web' = 'ios') {
  jest.resetModules();

  /* eslint-disable @typescript-eslint/no-require-imports */
  const reactNative = require('react-native') as typeof import('react-native');
  Object.defineProperty(reactNative.Platform, 'OS', { value: platformOS, configurable: true });

  const reporter = require('@/features/analytics/error-reporter') as typeof import('@/features/analytics/error-reporter');
  const audio = require('@/features/audio/audio-file-storage') as typeof import('@/features/audio/audio-file-storage');
  const identity = require('@/features/auth/auth-identity') as typeof import('@/features/auth/auth-identity');
  const extra = require('@/features/shared/expo-extra') as typeof import('@/features/shared/expo-extra');
  const consent = require('@/features/upload-consent/upload-consent-storage') as typeof import('@/features/upload-consent/upload-consent-storage');
  const libraryStorage = require('../word-library-storage') as typeof import('../word-library-storage');
  const client = require('../word-upload-client') as typeof import('../word-upload-client');
  const orchestrator = require('../word-upload') as typeof import('../word-upload');
  /* eslint-enable @typescript-eslint/no-require-imports */

  const send = jest.mocked(client.sendWord);
  const reportError = jest.mocked(reporter.reportError);
  const loadLibrary = jest.mocked(libraryStorage.loadWordLibraryStore);

  jest.mocked(consent.loadUploadConsent).mockResolvedValue({
    status: 'granted',
    decidedAt: CREATED_FIRST,
    noticeVersion: 1,
  });
  jest.mocked(identity.getCurrentUid).mockReturnValue(FIREBASE_ANON_UID);
  jest.mocked(extra.readExtraString).mockReturnValue(API_BASE_URL);
  // 저장형 URI(`recording://<name>`)를 현재 컨테이너 기준 절대 경로로 바꾸는 실제 계약을 따른다.
  jest.mocked(audio.hydrateAudioUriFromStorage).mockImplementation((uri) =>
    uri?.startsWith('recording://') ? `${RECORDINGS_DIRECTORY}/${uri.slice('recording://'.length)}` : uri,
  );
  jest.mocked(audio.recordingFileExists).mockReturnValue(true);
  send.mockResolvedValue({ status: 200 });

  function setLibrary(...entries: WordEntry[]): void {
    loadLibrary.mockResolvedValue({
      version: 1,
      entriesById: Object.fromEntries(entries.map((entry) => [entry.id, entry])),
      updatedAt: CREATED_THIRD,
    });
  }

  setLibrary();

  return {
    requestWordUpload: orchestrator.requestWordUpload,
    requestWordUploadFlush: orchestrator.requestWordUploadFlush,
    audio,
    consent,
    identity,
    extra,
    send,
    reportError,
    setLibrary,
    sentWordIds: () => send.mock.calls.map(([input]) => input.clientWordId),
  };
}

let harness: Harness;

beforeEach(() => {
  harness = loadHarness();
});

describe('requestWordUpload', () => {
  it('sends only the word that was just created', async () => {
    const saranghae = recordedWord('사랑해', CREATED_FIRST);
    const danyeowa = recordedWord('다녀와', CREATED_SECOND);
    harness.setLibrary(saranghae, danyeowa);

    harness.requestWordUpload(danyeowa.id);
    await drainFlush();

    expect(harness.send).toHaveBeenCalledTimes(1);
    expect(harness.send).toHaveBeenCalledWith({
      apiBaseUrl: API_BASE_URL,
      uid: FIREBASE_ANON_UID,
      clientWordId: danyeowa.id,
      label: '다녀와',
      audioUri: `${RECORDINGS_DIRECTORY}/${recordingFileName(CREATED_SECOND)}`,
    });
  });

});

describe('requestWordUploadFlush', () => {
  it('sends every recorded word oldest first', async () => {
    const saranghae = recordedWord('사랑해', CREATED_FIRST);
    const danyeowa = recordedWord('다녀와', CREATED_SECOND);
    harness.setLibrary(danyeowa, saranghae);

    harness.requestWordUploadFlush();
    await drainFlush();

    expect(harness.sentWordIds()).toEqual([saranghae.id, danyeowa.id]);
  });

  // 첫 배포에는 처리 기록이 없다 (BB-238 결정). 서버에서 데이터가 지워져도 다음 콜드 스타트에
  // 회수되도록, 이미 보낸 단어도 트리거마다 다시 보낸다.
  it('sends a word again on the next flush even after a successful upload', async () => {
    const saranghae = recordedWord('사랑해', CREATED_FIRST);
    harness.setLibrary(saranghae);

    harness.requestWordUploadFlush();
    await drainFlush();
    harness.requestWordUploadFlush();
    await drainFlush();

    expect(harness.sentWordIds()).toEqual([saranghae.id, saranghae.id]);
  });

  // 4xx 로 거부된 단어도 기록이 없어 다시 보낸다 — 재전송을 거르는 규칙은 다음 업데이트 소관.
  it('sends a word again on the next flush even after a 4xx rejection', async () => {
    const saranghae = recordedWord('사랑해', CREATED_FIRST);
    harness.setLibrary(saranghae);
    harness.send.mockResolvedValue({ status: 400 });

    harness.requestWordUploadFlush();
    await drainFlush();
    harness.requestWordUploadFlush();
    await drainFlush();

    expect(harness.sentWordIds()).toEqual([saranghae.id, saranghae.id]);
    expect(harness.reportError).toHaveBeenCalledTimes(2);
  });

  it('skips preset words because the server seeds them', async () => {
    harness.setLibrary(presetWord('hello', '안녕', CREATED_FIRST));

    harness.requestWordUploadFlush();
    await drainFlush();

    expect(harness.send).not.toHaveBeenCalled();
  });
});

describe('upload gate', () => {
  it.each([
    ['consent is not granted', (h: Harness) => {
      jest.mocked(h.consent.loadUploadConsent).mockResolvedValue({
        status: 'denied',
        decidedAt: CREATED_FIRST,
        noticeVersion: 1,
      });
    }],
    ['the firebase uid is missing', (h: Harness) => {
      jest.mocked(h.identity.getCurrentUid).mockReturnValue(null);
    }],
    ['the api base url is missing', (h: Harness) => {
      jest.mocked(h.extra.readExtraString).mockReturnValue(null);
    }],
  ])('sends nothing when %s', async (_case, closeGate) => {
    harness.setLibrary(recordedWord('사랑해', CREATED_FIRST));
    closeGate(harness);

    harness.requestWordUploadFlush();
    await drainFlush();

    expect(harness.send).not.toHaveBeenCalled();
  });

  // 웹은 게이트 판정에 쓰는 Firebase auth 가 미지원이라 판정 전에 throw 난다 — 진입점에서 막는다.
  it('sends nothing on web', async () => {
    const webHarness = loadHarness('web');
    webHarness.setLibrary(recordedWord('사랑해', CREATED_FIRST));

    webHarness.requestWordUploadFlush();
    await drainFlush();

    expect(webHarness.send).not.toHaveBeenCalled();
  });

  // 전량 전송이라 실행이 길어질 수 있다. 그사이 동의가 철회되면 남은 단어를 보내지 않는다.
  it('stops before the next word when consent is revoked mid-flush', async () => {
    const saranghae = recordedWord('사랑해', CREATED_FIRST);
    const danyeowa = recordedWord('다녀와', CREATED_SECOND);
    harness.setLibrary(saranghae, danyeowa);
    harness.send.mockImplementationOnce(async () => {
      jest.mocked(harness.consent.loadUploadConsent).mockResolvedValue({
        status: 'denied',
        decidedAt: CREATED_SECOND,
        noticeVersion: 1,
      });
      return { status: 200 };
    });

    harness.requestWordUploadFlush();
    await drainFlush();

    expect(harness.sentWordIds()).toEqual([saranghae.id]);
  });

  it('stops before the next word when the firebase uid disappears mid-flush', async () => {
    const saranghae = recordedWord('사랑해', CREATED_FIRST);
    const danyeowa = recordedWord('다녀와', CREATED_SECOND);
    harness.setLibrary(saranghae, danyeowa);
    harness.send.mockImplementationOnce(async () => {
      jest.mocked(harness.identity.getCurrentUid).mockReturnValue(null);
      return { status: 200 };
    });

    harness.requestWordUploadFlush();
    await drainFlush();

    expect(harness.sentWordIds()).toEqual([saranghae.id]);
  });
});

describe('failure handling', () => {
  it('reports a 4xx rejection', async () => {
    harness.setLibrary(recordedWord('사랑해', CREATED_FIRST));
    harness.send.mockResolvedValue({ status: 400 });

    harness.requestWordUploadFlush();
    await drainFlush();

    expect(harness.reportError).toHaveBeenCalledWith(expect.any(Error), {
      scope: 'word-library.uploadFlush.rejected',
    });
  });

  it('keeps sending the remaining words past a 4xx', async () => {
    const saranghae = recordedWord('사랑해', CREATED_FIRST);
    const danyeowa = recordedWord('다녀와', CREATED_SECOND);
    harness.setLibrary(saranghae, danyeowa);
    harness.send.mockResolvedValueOnce({ status: 400 }).mockResolvedValueOnce({ status: 200 });

    harness.requestWordUploadFlush();
    await drainFlush();

    expect(harness.sentWordIds()).toEqual([saranghae.id, danyeowa.id]);
    expect(harness.reportError).toHaveBeenCalledTimes(1);
  });

  it('stops the run on 5xx instead of sending the rest', async () => {
    harness.setLibrary(recordedWord('사랑해', CREATED_FIRST), recordedWord('다녀와', CREATED_SECOND));
    harness.send.mockResolvedValue({ status: 503 });

    harness.requestWordUploadFlush();
    await drainFlush();

    expect(harness.send).toHaveBeenCalledTimes(1);
  });

  it('retries the halted word on the next trigger', async () => {
    const saranghae = recordedWord('사랑해', CREATED_FIRST);
    harness.setLibrary(saranghae);
    harness.send.mockResolvedValueOnce({ status: 500 }).mockResolvedValueOnce({ status: 200 });

    harness.requestWordUploadFlush();
    await drainFlush();
    harness.requestWordUploadFlush();
    await drainFlush();

    expect(harness.sentWordIds()).toEqual([saranghae.id, saranghae.id]);
  });

  // 기준 음성이 없으면 보낼 것이 없다. 파일 존재 확인만 하고 다음 단어로 넘어간다.
  it('skips a word whose reference audio file is gone', async () => {
    harness.setLibrary(recordedWord('사랑해', CREATED_FIRST));
    jest.mocked(harness.audio.recordingFileExists).mockReturnValue(false);

    harness.requestWordUploadFlush();
    await drainFlush();

    expect(harness.send).not.toHaveBeenCalled();
  });
});

describe('single-flight', () => {
  // 전송이 pending 인 창에 도착한 트리거는 예약으로 남았다가 현재 flush 가 끝난 뒤 재실행된다.
  it('reruns after the in-flight flush when another trigger arrives', async () => {
    const saranghae = recordedWord('사랑해', CREATED_FIRST);
    const danyeowa = recordedWord('다녀와', CREATED_SECOND);
    harness.setLibrary(saranghae);
    let resolveFirstSend!: (result: { status: number }) => void;
    harness.send.mockImplementationOnce(() => new Promise((resolve) => { resolveFirstSend = resolve; }));

    harness.requestWordUpload(saranghae.id);
    await drainFlush();
    expect(harness.send).toHaveBeenCalledTimes(1);

    harness.setLibrary(saranghae, danyeowa);
    harness.requestWordUploadFlush();
    resolveFirstSend({ status: 200 });
    await drainFlush();

    // 처리 기록이 없어 재실행이 방금 보낸 단어까지 다시 담는다 (BB-238 결정).
    expect(harness.sentWordIds()).toEqual([saranghae.id, saranghae.id, danyeowa.id]);
  });

  // 서로 다른 단어가 예약되면 전체로 넓힌다 — 하나를 버리면 다음 콜드 스타트까지 올라가지 못한다.
  it('widens to a full flush when two different words are queued mid-flight', async () => {
    const saranghae = recordedWord('사랑해', CREATED_FIRST);
    const danyeowa = recordedWord('다녀와', CREATED_SECOND);
    const sagwa = recordedWord('사과', CREATED_THIRD);
    harness.setLibrary(saranghae, danyeowa, sagwa);
    let resolveFirstSend!: (result: { status: number }) => void;
    harness.send.mockImplementationOnce(() => new Promise((resolve) => { resolveFirstSend = resolve; }));

    harness.requestWordUpload(saranghae.id);
    await drainFlush();

    harness.requestWordUpload(danyeowa.id);
    harness.requestWordUpload(sagwa.id);
    resolveFirstSend({ status: 200 });
    await drainFlush();

    expect(harness.sentWordIds()).toEqual([saranghae.id, saranghae.id, danyeowa.id, sagwa.id]);
  });

  it('does not rerun when no trigger arrived during the flush', async () => {
    harness.setLibrary(recordedWord('사랑해', CREATED_FIRST));

    harness.requestWordUploadFlush();
    await drainFlush();
    await drainFlush();

    expect(harness.send).toHaveBeenCalledTimes(1);
  });
});

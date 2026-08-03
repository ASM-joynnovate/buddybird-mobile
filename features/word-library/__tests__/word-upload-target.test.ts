// 업로드 대상 선별과 재실행 예약 병합 (SPEC-0003 §단어 업로드 — 대상).
// 픽스처는 앱이 실제로 쓰는 생성 경로(`createWordEntry`)로 만든다 — id 는 `wentry-<ISO>-<random>`,
// 사용자 녹음의 오디오 URI 는 저장형(`recording://…`), 프리셋은 `preset://<label>`.

import { createWordEntry } from '../word-library-model';
import type { WordEntry } from '../word-library-types';
import type { WordUploadState } from '../word-upload-state';
import { mergeUploadTargets, selectPendingWords, type UploadTarget } from '../word-upload-target';

const CREATED_FIRST = '2026-08-01T09:14:32.118Z';
const CREATED_SECOND = '2026-08-02T20:37:05.441Z';
const CREATED_THIRD = '2026-08-03T18:41:09.552Z';

function recordedWord(label: string, createdAt: string): WordEntry {
  return createWordEntry(
    {
      label,
      tag: 'greeting',
      sourceType: 'recording',
      audioUri: `recording://recording-${createdAt.replace(/[:.]/g, '-')}.m4a`,
    },
    createdAt,
  );
}

function presetWord(presetKey: string, label: string, createdAt: string): WordEntry {
  return createWordEntry(
    { label, tag: 'greeting', sourceType: 'preset', presetKey, audioUri: `preset://${label}` },
    createdAt,
  );
}

describe('selectPendingWords', () => {
  describe('selected words', () => {
    it('includes a recorded word that has no processing record', () => {
      const saranghae = recordedWord('사랑해', CREATED_FIRST);

      expect(selectPendingWords([saranghae], {})).toEqual([saranghae]);
    });

    it('excludes only the recorded word and leaves the rest pending', () => {
      const uploaded = recordedWord('사과', CREATED_FIRST);
      const pending = recordedWord('다녀와', CREATED_SECOND);
      const state: WordUploadState = { [uploaded.id]: { status: 'uploaded' } };

      expect(selectPendingWords([uploaded, pending], state)).toEqual([pending]);
    });
  });

  describe('excluded words', () => {
    // 프리셋 단어는 서버가 시드하므로 클라이언트가 올리지 않는다.
    it('excludes preset words', () => {
      const hello = presetWord('hello', '안녕', CREATED_FIRST);

      expect(selectPendingWords([hello], {})).toEqual([]);
    });

    // `failed` 는 4xx 거부라 재전송해도 결과가 같다 — `uploaded` 와 동일하게 제외한다.
    it.each(['uploaded', 'failed'] as const)('excludes a word already recorded as %s', (status) => {
      const saranghae = recordedWord('사랑해', CREATED_FIRST);
      const state: WordUploadState = { [saranghae.id]: { status } };

      expect(selectPendingWords([saranghae], state)).toEqual([]);
    });
  });

  describe('ordering', () => {
    it('orders the selection by creation time, oldest first', () => {
      const newest = recordedWord('다녀와', CREATED_THIRD);
      const oldest = recordedWord('사랑해', CREATED_FIRST);
      const middle = recordedWord('사과', CREATED_SECOND);

      expect(selectPendingWords([newest, oldest, middle], {})).toEqual([oldest, middle, newest]);
    });
  });
});

describe('mergeUploadTargets', () => {
  const SARANGHAE_ID = 'wentry-2026-08-01T09:14:32.118Z-k3n8v2qa';
  const DANYEOWA_ID = 'wentry-2026-08-03T18:41:09.552Z-p7t1m5xe';
  const ALL: UploadTarget = { kind: 'all' };

  it('takes the incoming target when nothing is queued', () => {
    const incoming: UploadTarget = { kind: 'single', wordId: SARANGHAE_ID };

    expect(mergeUploadTargets(null, incoming)).toEqual(incoming);
  });

  it('keeps the queued target when the same word arrives again', () => {
    const queued: UploadTarget = { kind: 'single', wordId: SARANGHAE_ID };

    expect(mergeUploadTargets(queued, { kind: 'single', wordId: SARANGHAE_ID })).toEqual(queued);
  });

  // 둘 중 하나를 버리면 그 단어가 다음 콜드 스타트까지 서버에 올라가지 못한다.
  it('widens to all when a different word arrives', () => {
    const queued: UploadTarget = { kind: 'single', wordId: SARANGHAE_ID };
    const incoming: UploadTarget = { kind: 'single', wordId: DANYEOWA_ID };

    expect(mergeUploadTargets(queued, incoming)).toEqual(ALL);
  });

  it.each([
    ['queued all, incoming single', ALL, { kind: 'single', wordId: SARANGHAE_ID } as const],
    ['queued single, incoming all', { kind: 'single', wordId: SARANGHAE_ID } as const, ALL],
    ['queued all, incoming all', ALL, ALL],
  ])('stays on all when %s', (_case, queued: UploadTarget, incoming: UploadTarget) => {
    expect(mergeUploadTargets(queued, incoming)).toEqual(ALL);
  });
});

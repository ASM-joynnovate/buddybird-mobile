// 업로드 대상 선별과 재실행 예약 병합 (SPEC-0003 §단어 업로드 — 대상).
// 픽스처는 앱이 실제로 쓰는 생성 경로(`createWordEntry`)로 만든다 — id 는 `wentry-<ISO>-<random>`,
// 사용자 녹음의 오디오 URI 는 저장형(`recording://…`), 프리셋은 `preset://<label>`.

import { createWordEntry } from '../word-library-model';
import type { WordEntry } from '../word-library-types';
import { mergeUploadTargets, selectUploadableWords, type UploadTarget } from '../word-upload-target';

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

describe('selectUploadableWords', () => {
  describe('selected words', () => {
    it('includes a recorded word', () => {
      const saranghae = recordedWord('사랑해', CREATED_FIRST);

      expect(selectUploadableWords([saranghae])).toEqual([saranghae]);
    });

    // 첫 배포에는 처리 기록이 없다 — 이미 보낸 단어도 매번 다시 고른다 (BB-238 결정).
    // 서버에서 데이터가 지워져도 다음 콜드 스타트에 회수된다.
    it('keeps selecting every recorded word on each run', () => {
      const saranghae = recordedWord('사랑해', CREATED_FIRST);
      const danyeowa = recordedWord('다녀와', CREATED_SECOND);

      expect(selectUploadableWords([saranghae, danyeowa])).toEqual([saranghae, danyeowa]);
      expect(selectUploadableWords([saranghae, danyeowa])).toEqual([saranghae, danyeowa]);
    });
  });

  describe('excluded words', () => {
    // 프리셋 단어는 서버가 시드하므로 클라이언트가 올리지 않는다.
    it('excludes preset words', () => {
      const hello = presetWord('hello', '안녕', CREATED_FIRST);

      expect(selectUploadableWords([hello])).toEqual([]);
    });

    it('excludes preset words while keeping recorded ones', () => {
      const hello = presetWord('hello', '안녕', CREATED_FIRST);
      const saranghae = recordedWord('사랑해', CREATED_SECOND);

      expect(selectUploadableWords([hello, saranghae])).toEqual([saranghae]);
    });
  });

  describe('ordering', () => {
    it('orders the selection by creation time, oldest first', () => {
      const newest = recordedWord('다녀와', CREATED_THIRD);
      const oldest = recordedWord('사랑해', CREATED_FIRST);
      const middle = recordedWord('사과', CREATED_SECOND);

      expect(selectUploadableWords([newest, oldest, middle])).toEqual([oldest, middle, newest]);
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

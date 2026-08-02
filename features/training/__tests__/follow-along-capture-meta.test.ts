import { buildCaptureRegistrationMeta, resolveClientWordId } from '../follow-along-capture-meta';

describe('resolveClientWordId', () => {
  it('prefers presetKey over libraryEntryId', () => {
    expect(
      resolveClientWordId('word-1', { presetKey: 'hello', libraryEntryId: 'wentry-abc' }),
    ).toBe('preset-hello');
  });

  it('uses libraryEntryId when presetKey is absent', () => {
    expect(resolveClientWordId('word-1', { libraryEntryId: 'wentry-abc' })).toBe('wentry-abc');
  });

  it('degrades to the raw wordId when the word is not found', () => {
    expect(resolveClientWordId('word-1', undefined)).toBe('word-1');
  });

  it('degrades to the raw wordId when the word has neither key', () => {
    expect(resolveClientWordId('word-1', {})).toBe('word-1');
  });

  it('falls through an empty presetKey to libraryEntryId', () => {
    expect(resolveClientWordId('word-1', { presetKey: '', libraryEntryId: 'wentry-abc' })).toBe('wentry-abc');
  });

  it('falls through empty presetKey and libraryEntryId to the raw wordId', () => {
    expect(resolveClientWordId('word-1', { presetKey: '', libraryEntryId: '' })).toBe('word-1');
  });
});

describe('buildCaptureRegistrationMeta', () => {
  it('snapshots species and birthDate from the profile', () => {
    expect(
      buildCaptureRegistrationMeta('word-1', { presetKey: 'hello' }, { species: 'budgie', birthDate: '2024-05-01' }),
    ).toEqual({
      clientWordId: 'preset-hello',
      parrotSpecies: 'budgie',
      parrotBirthdate: '2024-05-01',
    });
  });

  it('uses nulls when there is no profile', () => {
    expect(buildCaptureRegistrationMeta('word-1', undefined, null)).toEqual({
      clientWordId: 'word-1',
      parrotSpecies: null,
      parrotBirthdate: null,
    });
  });

  it('keeps birthDate null when unknown (프로필 생년월일 모름)', () => {
    expect(
      buildCaptureRegistrationMeta('word-1', { libraryEntryId: 'wentry-abc' }, { species: 'cockatiel', birthDate: null }),
    ).toEqual({
      clientWordId: 'wentry-abc',
      parrotSpecies: 'cockatiel',
      parrotBirthdate: null,
    });
  });
});

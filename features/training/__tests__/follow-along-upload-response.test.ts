import { interpretCaptureBatchResult } from '../follow-along-upload-response';

const IDS = ['cap-a', 'cap-b', 'cap-c'];

function successBody(entries: Record<string, unknown>) {
  return { message: '클립 업로드 성공', data: entries, meta: null };
}

describe('interpretCaptureBatchResult', () => {
  it('marks all items successful on a clean 200', () => {
    const outcome = interpretCaptureBatchResult(
      {
        status: 200,
        body: successBody({
          'cap-a': { status: 'success' },
          'cap-b': { status: 'success' },
          'cap-c': { status: 'success' },
        }),
      },
      IDS,
    );
    expect(outcome).toEqual({ kind: 'processed', successIds: IDS, rejectedIds: [], unresolvedIds: [] });
  });

  it('separates rejected items while keeping successes (partial rejection)', () => {
    const outcome = interpretCaptureBatchResult(
      {
        status: 200,
        body: successBody({
          'cap-a': { status: 'success' },
          'cap-b': { status: 'rejected', code: 400, error_code: 'FILE__SIZE_EXCEEDED', message: '' },
          'cap-c': { status: 'success' },
        }),
      },
      IDS,
    );
    expect(outcome).toEqual({
      kind: 'processed',
      successIds: ['cap-a', 'cap-c'],
      rejectedIds: ['cap-b'],
      unresolvedIds: [],
    });
  });

  it('keeps items missing from the response unresolved', () => {
    const outcome = interpretCaptureBatchResult(
      { status: 200, body: successBody({ 'cap-a': { status: 'success' } }) },
      IDS,
    );
    expect(outcome).toEqual({
      kind: 'processed',
      successIds: ['cap-a'],
      rejectedIds: [],
      unresolvedIds: ['cap-b', 'cap-c'],
    });
  });

  it('treats a malformed 200 body as all-unresolved (nothing gets deleted)', () => {
    const outcome = interpretCaptureBatchResult({ status: 200, body: 'not json we expected' }, IDS);
    expect(outcome).toEqual({ kind: 'processed', successIds: [], rejectedIds: [], unresolvedIds: IDS });
  });

  it('splits a multi-item batch on a request-level 4xx', () => {
    expect(interpretCaptureBatchResult({ status: 400, body: null }, IDS)).toEqual({ kind: 'split' });
  });

  it('discards on a 4xx for a single-item batch', () => {
    expect(interpretCaptureBatchResult({ status: 400, body: null }, ['cap-a'])).toEqual({ kind: 'discard' });
  });

  it('halts on a 5xx', () => {
    expect(interpretCaptureBatchResult({ status: 500, body: null }, IDS)).toEqual({
      kind: 'halt',
      reason: 'server_error',
    });
  });

  it('halts on a network error (no response)', () => {
    expect(interpretCaptureBatchResult({ status: null, body: null }, IDS)).toEqual({
      kind: 'halt',
      reason: 'network_error',
    });
  });

  it('halts on an unexpected status with the server-error reason', () => {
    expect(interpretCaptureBatchResult({ status: 302, body: null }, IDS)).toEqual({
      kind: 'halt',
      reason: 'server_error',
    });
  });
});

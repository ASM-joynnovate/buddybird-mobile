import { interpretWordUploadResult } from '../word-upload-response';

describe('interpretWordUploadResult', () => {
  it.each([200, 201, 204])('marks %s as uploaded', (status) => {
    expect(interpretWordUploadResult({ status })).toEqual({ kind: 'uploaded' });
  });

  // 4xx 는 같은 요청을 다시 보내도 같은 답이 온다 — 영구 실패로 굳히고 재전송하지 않는다.
  it.each([400, 404, 413, 422, 499])('marks %s as failed', (status) => {
    expect(interpretWordUploadResult({ status })).toEqual({ kind: 'failed' });
  });

  it.each([500, 502, 503])('halts on %s so the word stays retriable', (status) => {
    expect(interpretWordUploadResult({ status })).toEqual({ kind: 'halt' });
  });

  it('halts when the request produced no response', () => {
    expect(interpretWordUploadResult({ status: null })).toEqual({ kind: 'halt' });
  });

  // 3xx 는 계약에 없다 — 단어를 영구 실패로 굳히지 않는 쪽으로 판정한다.
  it.each([301, 302])('halts on unexpected status %s', (status) => {
    expect(interpretWordUploadResult({ status })).toEqual({ kind: 'halt' });
  });
});

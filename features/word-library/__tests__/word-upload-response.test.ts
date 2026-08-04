// 전송 결과의 판정 (SPEC-0003 §단어 업로드 — 응답 처리).
// 상태 코드와 후속 행동 3종(uploaded·failed·halt)의 대응만 검증한다.

import { interpretWordUploadResult } from '../word-upload-response';

describe('interpretWordUploadResult', () => {
  describe('uploaded', () => {
    it.each([200, 201, 204])('resolves status %i to uploaded', (status) => {
      expect(interpretWordUploadResult({ status })).toEqual({ kind: 'uploaded' });
    });
  });

  describe('failed', () => {
    // 4xx 는 영구 거부다. `failed` 로 굳혀 그 단어를 다시 보내지 않는다.
    it.each([400, 404, 413, 422, 499])('resolves status %i to failed', (status) => {
      expect(interpretWordUploadResult({ status })).toEqual({ kind: 'failed' });
    });
  });

  describe('halt', () => {
    // 5xx 는 서버측 일시 장애다. 실행을 중단하고 다음 트리거가 다시 보낸다.
    it.each([500, 502, 503])('resolves status %i to halt', (status) => {
      expect(interpretWordUploadResult({ status })).toEqual({ kind: 'halt' });
    });

    it('resolves a missing response to halt', () => {
      expect(interpretWordUploadResult({ status: null })).toEqual({ kind: 'halt' });
    });

    // 계약에 없는 상태 코드는 거부로 단정하지 않고 중단해 다음 트리거에 맡긴다.
    it.each([301, 302, 100])('resolves the uncontracted status %i to halt', (status) => {
      expect(interpretWordUploadResult({ status })).toEqual({ kind: 'halt' });
    });
  });
});

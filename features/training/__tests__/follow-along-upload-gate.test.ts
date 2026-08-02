import { isUploadGateOpen } from '../follow-along-upload-gate';

describe('isUploadGateOpen', () => {
  // 2³ 조합 — granted × uid × baseUrl 전부 참일 때만 열린다.
  it.each([
    ['granted', 'uid-1', 'https://api.test', true],
    ['granted', 'uid-1', null, false],
    ['granted', null, 'https://api.test', false],
    ['granted', null, null, false],
    ['denied', 'uid-1', 'https://api.test', false],
    ['denied', null, null, false],
    ['unknown', 'uid-1', 'https://api.test', false],
    ['unknown', null, 'https://api.test', false],
  ] as const)('consent=%s uid=%s baseUrl=%s → %s', (consentStatus, uid, apiBaseUrl, expected) => {
    expect(isUploadGateOpen({ consentStatus, uid, apiBaseUrl })).toBe(expected);
  });
});

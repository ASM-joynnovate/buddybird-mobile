// 절단 규칙 자체는 text-truncate 가 소유하고 거기서 검증한다 —
// 여기서는 그 규칙이 기기 필드에 실제로 걸리는지만 본다.

import { buildDeviceContractFields, buildUploadUrl } from '../upload-contract';

describe('buildDeviceContractFields', () => {
  it('maps the three device fields the contract requires', () => {
    expect(
      buildDeviceContractFields({ platformOS: 'ios', osVersion: '18.4.1', modelName: 'iPhone 17 Pro' }),
    ).toEqual({
      device_platform: 'iOS',
      device_os_version: '18.4.1',
      device_model: 'iPhone 17 Pro',
    });
  });

  // 계약값은 `iOS`·`Android` 두 가지다 — 그 외 플랫폼은 빈 문자열로 보낸다.
  it.each([
    ['ios', 'iOS'],
    ['android', 'Android'],
    ['web', ''],
  ])('maps platform %s to the contract value %s', (platformOS, expected) => {
    const fields = buildDeviceContractFields({ platformOS, osVersion: null, modelName: null });

    expect(fields.device_platform).toBe(expected);
  });

  it('sends empty device fields when expo-device read nothing', () => {
    const fields = buildDeviceContractFields({ platformOS: 'ios', osVersion: null, modelName: null });

    expect(fields.device_os_version).toBe('');
    expect(fields.device_model).toBe('');
  });

  // 상한 초과는 실기기에서 드물지만, 벤더 커스텀 빌드 문자열이 넘길 수 있다.
  it('truncates device fields to their contract limits', () => {
    const fields = buildDeviceContractFields({
      platformOS: 'android',
      osVersion: '15.0.0_custom_vendor_build_20260801',
      modelName: 'SM-S928N Galaxy S24 Ultra 5G Enterprise Edition',
    });

    expect(fields.device_os_version).toBe('15.0.0_custom_vendor');
    expect(fields.device_model).toBe('SM-S928N Galaxy S24 Ultra 5G E');
  });

  it('truncates device fields by code point', () => {
    const fields = buildDeviceContractFields({
      platformOS: 'android',
      osVersion: null,
      modelName: '📱'.repeat(40),
    });

    expect(Array.from(fields.device_model)).toHaveLength(30);
    expect(fields.device_model).toBe('📱'.repeat(30));
  });
});

describe('buildUploadUrl', () => {
  it('joins the path onto the base url', () => {
    expect(buildUploadUrl('https://api.buddybird.app', '/api/v1/words')).toBe(
      'https://api.buddybird.app/api/v1/words',
    );
  });

  // 끝 슬래시를 그대로 이으면 `//api/v1/...` 이 되고, 서버 404 는 4xx 경로로 흘러
  // 설정 실수 하나가 단어 전량 거부·캡처 전량 폐기로 증폭된다.
  it.each(['https://api.buddybird.app/', 'https://api.buddybird.app///'])(
    'normalizes the trailing slash in %s',
    (apiBaseUrl) => {
      expect(buildUploadUrl(apiBaseUrl, '/api/v1/captures')).toBe(
        'https://api.buddybird.app/api/v1/captures',
      );
    },
  );
});

import { RecordingPresets } from 'expo-audio';

// metering VAD 훅(따라하기 갭·휴식 구간) 공용 녹음 프리셋. metering 없이는 VAD 가 성립하지 않는다.
export const VAD_RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

// 휴식 구간 롤링 레코더: 발화 없이 이만큼 무음이 이어지면 현재 청크를 버리고 새 청크로 다시 녹음한다.
// 저장되는 발화 파일이 앞에 달고 갈 무음의 상한(100ms 폴링 기준 30샘플 ≈ 3.0초)이 된다.
// 키우면 파일이 무거워지고, 줄이면 네이티브 stop/prepare 왕복이 잦아진다.
export const ROLL_SILENCE_SAMPLES = 30;

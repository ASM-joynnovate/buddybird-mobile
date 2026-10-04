import { Asset } from 'expo-asset';

const TRACK_MODULES = [
	require('@assets/audio/stress-care/track-02.m4a') as number,
	require('@assets/audio/stress-care/track-03.m4a') as number,
	require('@assets/audio/stress-care/track-04.m4a') as number,
];

/** 스트레스 케어 음원 파일을 불러오는 함수 */
export const loadStressCareTracks = async () => {
	const assets = await Asset.loadAsync(TRACK_MODULES);

	return assets.map((asset) => asset.localUri ?? asset.uri);
};

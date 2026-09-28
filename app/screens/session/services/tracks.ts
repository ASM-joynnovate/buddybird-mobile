import { Asset } from 'expo-asset';

const TRACK_MODULES = [
	require('@assets/audio/stress-care/track-02.m4a') as number,
	require('@assets/audio/stress-care/track-03.m4a') as number,
	require('@assets/audio/stress-care/track-04.m4a') as number,
];

export async function stressCareTracks(): Promise<string[]> {
	const assets = await Asset.loadAsync(TRACK_MODULES);

	return assets.map((asset) => asset.localUri ?? asset.uri);
}

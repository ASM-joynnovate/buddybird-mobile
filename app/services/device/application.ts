import { Linking, Platform } from 'react-native';

import * as Application from 'expo-application';
import Constants from 'expo-constants';

import { env } from '@/config';
import { reportError } from '@/services/telemetry/client';

export const installedVersion = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '1.2.0';

export async function openAppStore() {
	const appId = Application.applicationId;

	if (Platform.OS !== 'ios' && !appId) {
		throw new Error('Missing installed application ID');
	}

	const storeAppUrl =
		Platform.OS === 'ios' ? `itms-apps://apps.apple.com/app/id${env.appStoreId}` : `market://details?id=${appId}`;
	const storeWebUrl =
		Platform.OS === 'ios'
			? `https://apps.apple.com/app/id${env.appStoreId}`
			: `https://play.google.com/store/apps/details?id=${appId}`;

	try {
		await Linking.openURL(storeAppUrl);
	} catch (e) {
		reportError(e, 'open_store_app');

		await Linking.openURL(storeWebUrl);
	}
}

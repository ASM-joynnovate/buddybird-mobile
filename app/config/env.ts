import { Platform } from 'react-native';

import Constants from 'expo-constants';

const isProduction = Constants.expoConfig?.extra?.production === true;
const apiBaseUrl = String(Constants.expoConfig?.extra?.apiBaseUrl ?? '').replace(/\/+$/, '');

export const env = {
	// Android 에뮬레이터에서는 Mac의 localhost에 10.0.2.2로 접속
	apiBaseUrl: Platform.OS === 'android' ? apiBaseUrl.replace('//localhost', '//10.0.2.2') : apiBaseUrl,
	supabaseUrl: String(Constants.expoConfig?.extra?.supabaseUrl ?? ''),
	supabasePublishableKey: String(Constants.expoConfig?.extra?.supabasePublishableKey ?? ''),
	clarityProjectId: String(Constants.expoConfig?.extra?.clarityProjectId ?? 'wre3hgbj48'),
	isProduction,
	appStoreId: isProduction ? '6783652711' : '6784253530',
};

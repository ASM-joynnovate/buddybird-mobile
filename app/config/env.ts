import { Platform } from 'react-native';

import Constants from 'expo-constants';

const isProduction = Constants.expoConfig?.extra?.production === true;
const apiBaseUrl = String(Constants.expoConfig?.extra?.apiBaseUrl ?? '').replace(/\/+$/, '');

export const env = {
	apiBaseUrl: Platform.OS === 'android' ? apiBaseUrl.replace('//localhost', '//10.0.2.2') : apiBaseUrl,
	supabaseUrl: String(Constants.expoConfig?.extra?.supabaseUrl ?? ''),
	supabasePublishableKey: String(Constants.expoConfig?.extra?.supabasePublishableKey ?? ''),
	clarityProjectId: String(Constants.expoConfig?.extra?.clarityProjectId ?? ''),
	hotUpdaterBaseUrl: 'https://ota.buddybird.xyz',
	websiteBaseUrl: 'https://buddybird.xyz',
	hotUpdaterApiKey: String(Constants.expoConfig?.extra?.hotUpdaterApiKey ?? ''),
	isProduction,
	appScheme: String(Constants.expoConfig?.scheme ?? ''),
	appStoreId: isProduction ? '6783652711' : '6784253530',
};

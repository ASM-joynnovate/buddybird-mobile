import Constants from 'expo-constants';

const isProduction = Constants.expoConfig?.extra?.production === true;

export const env = {
	apiBaseUrl: String(Constants.expoConfig?.extra?.apiBaseUrl ?? '').replace(/\/+$/, ''),
	supabaseUrl: String(Constants.expoConfig?.extra?.supabaseUrl ?? ''),
	supabasePublishableKey: String(Constants.expoConfig?.extra?.supabasePublishableKey ?? ''),
	clarityProjectId: String(Constants.expoConfig?.extra?.clarityProjectId ?? 'wre3hgbj48'),
	isProduction,
	appStoreId: isProduction ? '6783652711' : '6784253530',
};

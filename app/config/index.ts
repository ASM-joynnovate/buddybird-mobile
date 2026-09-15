import Constants from "expo-constants"

export const config = {
	apiBaseUrl: String(Constants.expoConfig?.extra?.apiBaseUrl ?? "").replace(/\/+$/, ""),
	supabaseUrl: String(Constants.expoConfig?.extra?.supabaseUrl ?? ""),
	supabasePublishableKey: String(Constants.expoConfig?.extra?.supabasePublishableKey ?? ""),
	clarityProjectId: String(Constants.expoConfig?.extra?.clarityProjectId ?? "wre3hgbj48"),
	production: Constants.expoConfig?.extra?.production === true,
}

import Constants from "expo-constants"

export const config = {
	apiBaseUrl: String(Constants.expoConfig?.extra?.apiBaseUrl ?? "").replace(/\/+$/, ""),
	clarityProjectId: String(Constants.expoConfig?.extra?.clarityProjectId ?? "wre3hgbj48"),
	production: Constants.expoConfig?.extra?.production === true,
}

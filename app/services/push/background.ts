import { getIsHeadless as nativeIsHeadless, getMessaging } from "@react-native-firebase/messaging"
import { Platform } from "react-native"

// Android background messages run in a separate Headless JS task without mounting App.
export const getIsHeadless = () =>
	Platform.OS === "ios" ? nativeIsHeadless(getMessaging()) : Promise.resolve(false)

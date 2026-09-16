import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"
import { useMMKVString } from "react-native-mmkv"

import {
	parseDeviceSetting,
	defaultDeviceSettings,
	deviceKeys,
	deviceStorage,
} from "@/services/storage/device-settings"
import { reportError } from "@/services/telemetry/client"
import type  { DeviceSettings } from "@/types/device-settings"

export function useDeviceSetting<K extends keyof DeviceSettings>(key: K): DeviceSettings[K] {
	const { t } = useTranslation()
	const [serialized] = useMMKVString(deviceKeys[key], deviceStorage)
	const result = useMemo(() => {
		try {
			return {
				value:
					serialized === undefined
						? defaultDeviceSettings()[key]
						: parseDeviceSetting(key, serialized),
				error: null,
			}
		} catch (error) {
			return { value: defaultDeviceSettings()[key], error }
		}
	}, [key, serialized])

	useEffect(() => {
		if (result.error) {
			reportError(result.error, `device_setting_${key}`)
			Alert.alert(t("storage.settingError"))
		}
	}, [key, result.error, t])

	return result.value
}

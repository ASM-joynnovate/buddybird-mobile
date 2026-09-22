import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useTranslation } from "react-i18next"

import { GuidePager, type GuideStep } from "@/components/guide-pager"
import { StartDialogs } from "@/screens/Session/components/start-dialogs"
import { cameraGranted, useStartSession } from "@/screens/Session/hooks/use-start-session"
import { reportError } from "@/services/telemetry/client"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import type { RootStackParamList } from "@/types/navigation"

const STEPS = [
	{ key: "start", icon: "volume" },
	{ key: "cycle", icon: "clock" },
	{ key: "mimicry", icon: "mimicry" },
	{ key: "alert", icon: "warning" },
	{ key: "setup", icon: "charging" },
] as const

export function PlacementGuideScreen() {
	const { t } = useTranslation()

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const { params } = useRoute<RouteProp<RootStackParamList, "PlacementGuide">>()

	const guides = useDeviceSettingsStore((state) => state.guides)

	const starter = useStartSession((sessionId) => navigation.replace("SessionRun", { sessionId }))

	const steps: GuideStep[] = STEPS.map((step) => ({
		title: t(`session.placement.${step.key}.title`),
		scene: t(`session.placement.${step.key}.scene`),
		icon: step.icon,
	}))

	function toggle(value: boolean) {
		try {
			useDeviceSettingsStore.getState().setGuideSeen("placement", value)
		} catch (error) {
			reportError(error, "device_setting_guides")
		}
	}

	async function finish() {
		if (params.source === "help") {
			navigation.goBack()
		} else if (await cameraGranted()) {
			navigation.navigate("CameraSetup", { draft: params.draft })
		} else {
			starter.start(params.draft)
		}
	}

	return (
		<>
			<GuidePager
				steps={steps}
				onFinish={() => void finish()}
				dontShowAgain={{ value: guides.placement, onChange: toggle }}
				finishLabel={params.source === "help" ? t("common.close") : undefined}
			/>
			<StartDialogs state={starter} />
		</>
	)
}

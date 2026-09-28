import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { MessageSquareTextIcon, MicIcon, MoonIcon, SmartphoneIcon } from "lucide-react-native"
import type { ReactElement } from "react"
import { useTranslation } from "react-i18next"

import { GuidePager, type GuideStep } from "@/components/guide-pager"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import type { RootStackParamList } from "@/types/navigation"

export function RecordingGuideScreen(): ReactElement {
	const { t } = useTranslation()

	const { params } = useRoute<RouteProp<RootStackParamList, "RecordingGuide">>()
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const guides = useDeviceSettingsStore((state) => state.guides)

	const steps: GuideStep[] = [
		{
			title: t("words.guide.samples"),
			scene: t("words.guide.samplesScene"),
			icon: MicIcon,
		},
		{ title: t("words.guide.quiet"), scene: t("words.guide.quietScene"), icon: MoonIcon },
		{
			title: t("words.guide.distance"),
			scene: t("words.guide.distanceScene"),
			icon: SmartphoneIcon,
		},
		{
			title: t("words.guide.clear"),
			scene: t("words.guide.clearScene"),
			icon: MessageSquareTextIcon,
		},
	]

	function leave() {
		if (params.source === "add") {
			navigation.replace("Recorder", { wordName: params.wordName })
		} else {
			navigation.goBack()
		}
	}

	return (
		<GuidePager
			steps={steps}
			actions={{ finish: leave, skip: leave }}
			finishLabel={t(params.source === "add" ? "words.guide.record" : "words.guide.done")}
			dontShowAgain={{
				value: guides.recording,
				onChange: (recording) =>
					useDeviceSettingsStore.getState().setGuideSeen("recording", recording),
			}}
		/>
	)
}

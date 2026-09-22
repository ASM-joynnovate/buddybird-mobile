import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useTranslation } from "react-i18next"

import { GuidePager, type GuideStep } from "@/components/guide-pager"
import type { RootStackParamList } from "@/types/navigation"

export function UsageGuideScreen() {
	const { t } = useTranslation()
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const steps: GuideStep[] = [
		{ title: t("entry.usage.words.title"), scene: t("entry.usage.words.scene"), icon: "mic" },
		{ title: t("entry.usage.login.title"), scene: t("entry.usage.login.scene"), icon: "link" },
		{
			title: t("entry.usage.station.title"),
			scene: t("entry.usage.station.scene"),
			icon: "device",
		},
		{
			title: t("entry.usage.viewer.title"),
			scene: t("entry.usage.viewer.scene"),
			icon: "bell",
		},
	]
	const next = () => navigation.navigate("PermissionRequest")

	return (
		<GuidePager
			steps={steps}
			onFinish={next}
			onSkip={next}
			onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
			finishLabel={t("common.next")}
		/>
	)
}

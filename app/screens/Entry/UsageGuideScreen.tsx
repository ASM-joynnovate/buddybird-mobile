import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useTranslation } from "react-i18next"

import { GuidePager, type GuideStep } from "@/components/guide-pager"
import type { RootStackParamList } from "@/types/navigation"

export function UsageGuideScreen() {
	const { t } = useTranslation()

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const steps: GuideStep[] = [
		{ title: t("entry.usage.record.title"), scene: t("entry.usage.record.scene"), icon: "mic" },
		{
			title: t("entry.usage.place.title"),
			scene: t("entry.usage.place.scene"),
			icon: "device",
		},
		{ title: t("entry.usage.keepOn.title"), scene: t("entry.usage.keepOn.scene"), icon: "sun" },
		{
			title: t("entry.usage.report.title"),
			scene: t("entry.usage.report.scene"),
			icon: "report",
		},
	]
	const next = () => navigation.navigate("PermissionRequest")

	return (
		<GuidePager
			steps={steps}
			actions={{
				finish: next,
				skip: next,
				back: navigation.canGoBack() ? () => navigation.goBack() : undefined,
			}}
			finishLabel={t("common.next")}
		/>
	)
}

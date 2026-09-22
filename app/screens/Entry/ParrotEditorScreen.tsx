import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { Screen } from "@/components/ui/screen"
import { ScreenError, Skeleton } from "@/components/ui/states"
import { parrotsQueryOptions } from "@/hooks/apis/parrots"
import { ParrotEditorForm } from "@/screens/Entry/components/parrot-editor-form"
import type { RootStackParamList } from "@/types/navigation"

export function ParrotEditorScreen() {
	const { t } = useTranslation()
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const params = useRoute<RouteProp<RootStackParamList, "ParrotEditor">>().params
	const parrotId = params?.parrotId
	const entry = params?.source === "entry"
	const parrots = useQuery(parrotsQueryOptions())
	const canGoBack = navigation.canGoBack()

	function done() {
		if (entry) {
			if (parrotId) {
				navigation.navigate("UsageGuide")
			}

			return
		}

		if (navigation.canGoBack()) {
			navigation.goBack()
		}
	}

	if (parrotId && !parrots.data) {
		return (
			<Screen>
				{parrots.isError ? (
					<ScreenError
						message={t("common.loadError")}
						onRetry={() => void parrots.refetch()}
					/>
				) : (
					<Skeleton rows={4} />
				)}
			</Screen>
		)
	}

	const parrot = parrotId ? parrots.data?.find((item) => item.id === parrotId) : undefined

	if (parrotId && !parrot) {
		return <Screen />
	}

	return (
		<ParrotEditorForm
			key={parrot?.id ?? "new"}
			parrot={parrot}
			canDelete={(parrots.data?.length ?? 0) > 1}
			intro={entry || !parrot}
			onBack={canGoBack ? () => navigation.goBack() : undefined}
			onDone={done}
		/>
	)
}

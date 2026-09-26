import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { Screen } from "@/components/ui/screen"
import { ScreenError } from "@/components/ui/screen-error"
import { ScreenHeader } from "@/components/ui/screen-header"
import { Skeleton } from "@/components/ui/skeleton"
import { meQueryOptions } from "@/hooks/apis/users"
import { AccountForm } from "@/screens/Profile/components/account-form"
import type { ProfileStackParamList } from "@/types/navigation"

export function AccountEditorScreen() {
	const { t } = useTranslation()
	const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>()
	const me = useQuery(meQueryOptions())

	function body() {
		if (me.isError) {
			return <ScreenError message={t("common.loadError")} onRetry={() => void me.refetch()} />
		}

		if (!me.data) {
			return <Skeleton rows={2} />
		}

		return <AccountForm user={me.data} onSaved={() => navigation.goBack()} />
	}

	return (
		<Screen>
			<ScreenHeader title={t("profile.editAccount")} onBack={() => navigation.goBack()} />
			{body()}
		</Screen>
	)
}

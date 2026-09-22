import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useMutation, useQuery } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import { useTranslation } from "react-i18next"

import type { Consent } from "@/apis/consents"
import { ScreenHeader } from "@/components/ui/header"
import { InlineError } from "@/components/ui/inline-error"
import { GroupedList } from "@/components/ui/rows"
import { Screen } from "@/components/ui/screen"
import { ScreenError, Skeleton } from "@/components/ui/states"
import { consentsQueryOptions, saveConsentsMutationOptions } from "@/hooks/apis/consents"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { ConsentRow } from "@/screens/Entry/components/consent-row"
import { latestConsents } from "@/screens/Entry/consent-agreements"
import type { RootStackParamList } from "@/types/navigation"

export function ConsentSettingsScreen() {
	const { t } = useTranslation()
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const locale = useDeviceSetting("locale")
	const query = useQuery(consentsQueryOptions(locale))
	const mutation = useMutation(saveConsentsMutationOptions())

	function toggle(consent: Consent) {
		if (mutation.isPending) {
			return
		}

		mutation.mutate({
			decisions: [
				{
					consent_id: consent.id,
					status: consent.status === "granted" ? "denied" : "granted",
				},
			],
			idempotencyKey: randomUUID(),
		})
	}

	function body() {
		if (query.isError) {
			return (
				<ScreenError message={t("common.loadError")} onRetry={() => void query.refetch()} />
			)
		}

		if (!query.data) {
			return <Skeleton rows={4} height={56} />
		}

		return (
			<>
				<GroupedList>
					{latestConsents(query.data).map((consent, index) => (
						<ConsentRow
							key={consent.id}
							first={index === 0}
							consent={consent}
							checked={consent.is_required || consent.status === "granted"}
							disabled={consent.is_required || mutation.isPending}
							onToggle={() => toggle(consent)}
							onOpen={() =>
								navigation.navigate("ConsentDetail", {
									consentId: consent.id,
									source: "settings",
								})
							}
						/>
					))}
				</GroupedList>
				<InlineError message={mutation.isError ? t("settings.consents.saveError") : null} />
			</>
		)
	}

	return (
		<Screen>
			<ScreenHeader title={t("settings.consents.title")} onBack={() => navigation.goBack()} />
			{body()}
		</Screen>
	)
}

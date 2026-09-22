import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useMutation, useQuery } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import { useTranslation } from "react-i18next"
import { StyleSheet } from "react-native"

import { Button } from "@/components/ui/button"
import { ScreenHeader } from "@/components/ui/header"
import { InlineError } from "@/components/ui/inline-error"
import { Screen } from "@/components/ui/screen"
import { ScreenError, Skeleton } from "@/components/ui/states"
import { Copy } from "@/components/ui/text"
import { consentsQueryOptions, saveConsentsMutationOptions } from "@/hooks/apis/consents"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { markAgreed } from "@/screens/Entry/consent-agreements"
import type { RootStackParamList } from "@/types/navigation"

export function ConsentDetailScreen() {
	const { t } = useTranslation()
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const { consentId, source } = useRoute<RouteProp<RootStackParamList, "ConsentDetail">>().params
	const locale = useDeviceSetting("locale")
	const query = useQuery(consentsQueryOptions(locale))
	const mutation = useMutation(saveConsentsMutationOptions())
	const consent = query.data?.find((item) => item.id === consentId)
	const canAgree =
		consent !== undefined &&
		(source === "entry" || (!consent.is_required && consent.status !== "granted"))

	function agree() {
		if (!consent) {
			return
		}

		if (source === "entry") {
			markAgreed(consent.id)
			navigation.goBack()

			return
		}

		mutation.mutate(
			{
				decisions: [{ consent_id: consent.id, status: "granted" }],
				idempotencyKey: randomUUID(),
			},
			{ onSuccess: () => navigation.goBack() },
		)
	}

	function body() {
		if (query.isError) {
			return (
				<ScreenError message={t("common.loadError")} onRetry={() => void query.refetch()} />
			)
		}

		if (!consent) {
			return <Skeleton rows={6} height={20} />
		}

		return <Copy style={styles.text}>{consent.body}</Copy>
	}

	return (
		<Screen
			footer={
				canAgree ? (
					<>
						<InlineError
							message={mutation.isError ? t("settings.consents.saveError") : null}
						/>
						<Button
							label={t("entry.consentDetail.agree")}
							loading={mutation.isPending}
							onPress={agree}
						/>
					</>
				) : undefined
			}
		>
			<ScreenHeader title={consent?.title} onBack={() => navigation.goBack()} />
			{body()}
		</Screen>
	)
}

const styles = StyleSheet.create({
	text: { fontSize: 15, lineHeight: 24 },
})

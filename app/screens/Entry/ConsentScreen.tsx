import { useFocusEffect, useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { BuddySays } from "@/components/buddy-says"
import { ConsentRow } from "@/components/consent-row"
import { Button } from "@/components/ui/button"
import { InlineError } from "@/components/ui/inline-error"
import { CheckRow, GroupedList } from "@/components/ui/rows"
import { Screen } from "@/components/ui/screen"
import { ScreenError } from "@/components/ui/screen-error"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/surface"
import { useEntryRoute } from "@/hooks/use-entry-route"
import { useConsentChecks } from "@/screens/Entry/hooks/use-consent-checks"
import { completeOnboardingStep, viewOnboardingStep } from "@/services/telemetry/onboarding"
import type { RootStackParamList } from "@/types/navigation"

export function ConsentScreen() {
	const { t } = useTranslation()

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const { route, parrotId } = useEntryRoute()

	const form = useConsentChecks(() => {
		completeOnboardingStep("consent")

		if (route !== "Consent") {
			navigation.navigate("ParrotEditor", {
				parrotId: route === "UsageGuide" ? parrotId : undefined,
				source: "entry",
			})
		}
	})

	useFocusEffect(
		useCallback(() => {
			viewOnboardingStep("consent")
		}, []),
	)

	function body() {
		if (form.loadFailed) {
			return <ScreenError message={t("common.loadError")} onRetry={form.retry} />
		}

		if (!form.consents) {
			return <Skeleton rows={4} height={56} />
		}

		return (
			<>
				<Card contentStyle={styles.allCard}>
					<CheckRow
						first
						label={t("entry.consent.all")}
						checked={form.allChecked}
						disabled={form.saving}
						onToggle={form.toggleAll}
					/>
				</Card>
				<GroupedList>
					{form.consents.map((consent, index) => (
						<ConsentRow
							key={consent.id}
							first={index === 0}
							consent={consent}
							checked={form.isChecked(consent)}
							disabled={form.saving}
							actions={{
								toggle: () => form.toggle(consent),
								open: () =>
									navigation.navigate("ConsentDetail", {
										consentId: consent.id,
										source: "entry",
									}),
							}}
						/>
					))}
				</GroupedList>
			</>
		)
	}

	return (
		<Screen
			footer={
				<>
					<InlineError message={form.saveFailed ? t("common.saveErrorKept") : null} />
					<Button
						label={t("common.next")}
						disabled={!form.consents || !form.ready}
						loading={form.saving}
						onPress={form.save}
					/>
				</>
			}
		>
			<View style={styles.intro}>
				<BuddySays message={t("entry.consent.intro")} />
			</View>
			<View style={styles.content}>{body()}</View>
		</Screen>
	)
}

const styles = StyleSheet.create({
	intro: { flexGrow: 1, paddingBottom: 28 },
	content: { gap: 20 },
	allCard: { padding: 0 },
})

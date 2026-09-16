import { useFocusEffect } from "@react-navigation/native"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Chip } from "@/components/ui/chip"
import { InlineError } from "@/components/ui/inline-error"
import { Screen } from "@/components/ui/screen"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { useProfile, useProfileStats } from "@/hooks/use-app-data"
import { ProfileAchievements } from "@/screens/Profile/components/profile-achievements"
import { ProfileActions } from "@/screens/Profile/components/profile-actions"
import { ProfileCard } from "@/screens/Profile/components/profile-card"
import { ProfileStatistics } from "@/screens/Profile/components/profile-statistics"
import { useProfileLanguage } from "@/screens/Profile/hooks/use-profile-language"
import { screen } from "@/services/telemetry/client"

export function ProfileScreen() {
	const { t } = useTranslation()
	const profile = useProfile()
	const { locale, error, changeLanguage } = useProfileLanguage()
	const stats = useProfileStats()

	useFocusEffect(
		useCallback(() => {
			screen("profile")
		}, []),
	)

	return (
		<Screen contentContainerStyle={ui.tabContent}>
			{profile ? (
				<>
					<ProfileCard profile={profile} />
					<InlineError
						message={stats.incomplete ? t("storage.historyUnavailable") : null}
					/>
					<ProfileStatistics stats={stats} locale={locale} />
					<Copy accessibilityRole="header" style={[ui.sectionTitle, ui.section]}>
						{t("profile.achievements")}
					</Copy>
					<ProfileAchievements stats={stats} locale={locale} />
				</>
			) : (
				<InlineError message={t("storage.profileUnavailable")} />
			)}

			<Copy accessibilityRole="header" style={[ui.sectionTitle, ui.section]}>
				{t("profile.language")}
			</Copy>
			<View style={ui.wrap}>
				<Chip
					testID="language-ko"
					label="한국어"
					selected={locale === "ko"}
					onPress={() => void changeLanguage("ko")}
				/>
				<Chip
					testID="language-en"
					label="English"
					selected={locale === "en"}
					onPress={() => void changeLanguage("en")}
				/>
			</View>

			<InlineError message={error} />

			{profile ? <ProfileActions /> : null}
		</Screen>
	)
}

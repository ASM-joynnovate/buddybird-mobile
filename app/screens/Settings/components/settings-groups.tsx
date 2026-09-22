import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Chip } from "@/components/ui/chip"
import { Icon } from "@/components/ui/icon"
import { InlineError } from "@/components/ui/inline-error"
import { GroupedList, NavRow } from "@/components/ui/rows"
import { Copy } from "@/components/ui/text"
import { useAppLanguage } from "@/screens/Settings/hooks/use-app-language"
import { installedVersion } from "@/services/device/application"
import { colors, font } from "@/theme"

export function GeneralGroup({
	onOpenDevices,
	onOpenPermissions,
}: {
	onOpenDevices(): void
	onOpenPermissions(): void
}) {
	const { t } = useTranslation()
	const language = useAppLanguage()

	return (
		<View>
			<GroupedList title={t("settings.general.title")}>
				<View style={styles.row}>
					<Icon name="words" size={22} color={colors.muted} />
					<Copy style={styles.label}>{t("settings.general.language")}</Copy>
					<Chip
						label={t("settings.general.korean")}
						selected={language.locale === "ko"}
						onPress={() => void language.changeLanguage("ko")}
					/>
					<Chip
						label={t("settings.general.english")}
						selected={language.locale === "en"}
						onPress={() => void language.changeLanguage("en")}
					/>
				</View>
				<NavRow
					icon="device"
					label={t("settings.general.devices")}
					onPress={onOpenDevices}
				/>
				<NavRow
					icon="lock"
					label={t("settings.general.permissions")}
					onPress={onOpenPermissions}
				/>
			</GroupedList>
			<InlineError message={language.error} />
		</View>
	)
}

export function SupportGroup({
	unreadNotice,
	onFeedback,
	onOpenNotices,
	onOpenConsents,
}: {
	unreadNotice: boolean
	onFeedback(): void
	onOpenNotices(): void
	onOpenConsents(): void
}) {
	const { t } = useTranslation()

	return (
		<View>
			<GroupedList title={t("settings.support.title")}>
				<NavRow
					first
					icon="send"
					label={t("settings.support.feedback")}
					onPress={onFeedback}
				/>
				<NavRow
					icon="notice"
					label={t("settings.support.notices")}
					value={unreadNotice ? t("settings.support.unreadNotice") : undefined}
					dot={unreadNotice}
					onPress={onOpenNotices}
				/>
				<NavRow
					icon="book"
					label={t("settings.support.consents")}
					onPress={onOpenConsents}
				/>
			</GroupedList>
			<Copy style={styles.version}>
				{t("settings.support.version", { version: installedVersion })}
			</Copy>
		</View>
	)
}

const styles = StyleSheet.create({
	row: {
		minHeight: 56,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	label: { flex: 1, minWidth: 0, marginLeft: 4, fontFamily: font.extraBold, fontSize: 16 },
	version: { marginTop: 12, fontSize: 13, color: colors.muted, textAlign: "right" },
})

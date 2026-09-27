import { LockIcon, MessageSquareTextIcon, SmartphoneIcon } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Chip } from "@/components/ui/chip"
import { GroupedList, NavRow } from "@/components/ui/rows"
import { Copy } from "@/components/ui/text"
import { useAppLanguage } from "@/screens/Settings/hooks/use-app-language"
import { colors, font } from "@/theme"

interface Props {
	onOpenDevices(): void
	onOpenPermissions(): void
}

export function GeneralGroup({ onOpenDevices, onOpenPermissions }: Props) {
	const { t } = useTranslation()

	const language = useAppLanguage()

	return (
		<View>
			<GroupedList title={t("settings.general.title")}>
				<View style={styles.row}>
					<MessageSquareTextIcon size={22} color={colors.muted} />
					<Copy style={styles.label}>{t("settings.general.language")}</Copy>
					<Chip
						label={t("settings.general.korean")}
						selected={language.locale === "ko-KR"}
						onPress={() => language.changeLanguage("ko-KR")}
					/>
					<Chip
						label={t("settings.general.english")}
						selected={language.locale === "en-US"}
						onPress={() => language.changeLanguage("en-US")}
					/>
				</View>
				<NavRow
					icon={SmartphoneIcon}
					label={t("settings.general.devices")}
					onPress={onOpenDevices}
				/>
				<NavRow
					icon={LockIcon}
					label={t("settings.general.permissions")}
					onPress={onOpenPermissions}
				/>
			</GroupedList>
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
})

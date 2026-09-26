import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { GroupedList, NavRow } from "@/components/ui/rows"
import { Copy } from "@/components/ui/text"
import { installedVersion } from "@/services/device/application"
import { colors } from "@/theme"

interface Props {
	unreadNotice: boolean
	onFeedback(): void
	onOpenNotices(): void
	onOpenConsents(): void
}

export function SupportGroup({ unreadNotice, onFeedback, onOpenNotices, onOpenConsents }: Props) {
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
	version: { marginTop: 12, fontSize: 13, color: colors.muted, textAlign: "right" },
})

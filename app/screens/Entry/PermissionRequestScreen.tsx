import { useNavigation } from "@react-navigation/native"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { BuddySays } from "@/components/buddy-says"
import { Illustration } from "@/components/illustration"
import { Button } from "@/components/ui/button"
import { ScreenHeader, TextButton } from "@/components/ui/header"
import { Icon, type IconName } from "@/components/ui/icon"
import { InlineError } from "@/components/ui/inline-error"
import { GroupedList } from "@/components/ui/rows"
import { Screen } from "@/components/ui/screen"
import { Copy } from "@/components/ui/text"
import { usePermissionRequest } from "@/screens/Entry/hooks/use-permission-request"
import { colors, font } from "@/theme"

const ROWS: readonly { kind: "microphone" | "camera" | "notifications"; icon: IconName }[] = [
	{ kind: "microphone", icon: "mic" },
	{ kind: "camera", icon: "camera" },
	{ kind: "notifications", icon: "bell" },
]

export function PermissionRequestScreen() {
	const { t } = useTranslation()
	const navigation = useNavigation()
	const request = usePermissionRequest()

	return (
		<Screen
			footer={
				<>
					<InlineError message={request.error} />
					<View style={styles.later}>
						<TextButton
							label={t("entry.permissions.later")}
							tone="muted"
							disabled={request.busy}
							onPress={request.later}
						/>
					</View>
					<Button
						label={t("entry.permissions.allow")}
						loading={request.busy}
						onPress={request.allow}
					/>
				</>
			}
		>
			<ScreenHeader onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
			<View style={styles.intro}>
				<BuddySays message={t("entry.permissions.title")} />
				<Illustration
					scene={t("entry.permissions.scene")}
					icon="lock"
					height={180}
					mascot={false}
				/>
			</View>
			<GroupedList>
				{ROWS.map(({ kind, icon }, index) => (
					<View key={kind} style={[styles.row, index > 0 && styles.divider]}>
						<Icon name={icon} size={24} color={colors.orangeDark} />
						<View style={styles.labels}>
							<Copy style={styles.name}>{t(`common.permission.${kind}.name`)}</Copy>
							<Copy style={styles.purpose}>{t(`entry.permissions.${kind}`)}</Copy>
						</View>
					</View>
				))}
			</GroupedList>
		</Screen>
	)
}

const styles = StyleSheet.create({
	intro: { flexGrow: 1, gap: 24, paddingBottom: 28 },
	row: {
		minHeight: 64,
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	divider: { borderTopWidth: 2, borderTopColor: colors.border },
	labels: { flex: 1, minWidth: 0, gap: 2 },
	name: { fontFamily: font.extraBold, fontSize: 16 },
	purpose: { fontSize: 13, color: colors.muted },
	later: { alignItems: "flex-end" },
})

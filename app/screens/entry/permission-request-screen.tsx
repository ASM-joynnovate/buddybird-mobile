import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { BellIcon, LockIcon, type LucideIcon, MicIcon } from "lucide-react-native"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { BuddySays } from "@/components/buddy-says"
import { Illustration } from "@/components/illustration"
import { Button } from "@/components/ui/button"
import { GroupedList } from "@/components/ui/grouped-list"
import { Screen } from "@/components/ui/screen"
import { ScreenHeader } from "@/components/ui/screen-header"
import { Copy } from "@/components/ui/text"
import { TextButton } from "@/components/ui/text-button"
import { usePermissionRequest } from "@/screens/entry/hooks/use-permission-request"
import { viewOnboardingStep } from "@/services/telemetry/onboarding"
import { colors, font } from "@/theme"

const PERMISSIONS: readonly { kind: "microphone" | "notifications"; icon: LucideIcon }[] = [
	{ kind: "microphone", icon: MicIcon },
	{ kind: "notifications", icon: BellIcon },
]

export function PermissionRequestScreen() {
	const { t } = useTranslation()

	const navigation = useNavigation()

	const request = usePermissionRequest()

	useFocusEffect(
		useCallback(() => {
			viewOnboardingStep("permissions")
		}, []),
	)

	return (
		<Screen
			footer={
				<>
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
					icon={LockIcon}
					height={180}
					mascot={false}
				/>
			</View>
			<GroupedList>
				{PERMISSIONS.map(({ kind, icon: Icon }, index) => (
					<View key={kind} style={[styles.row, index > 0 && styles.divider]}>
						<Icon size={24} color={colors.orangeDark} />
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

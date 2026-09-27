import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useTranslation } from "react-i18next"
import { FlatList, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { SoundRow } from "@/components/session/sound-row"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Screen } from "@/components/ui/screen"
import { ScreenError } from "@/components/ui/screen-error"
import { ScreenHeader } from "@/components/ui/screen-header"
import { Skeleton } from "@/components/ui/skeleton"
import { Copy } from "@/components/ui/text"
import { useSoundPlayer } from "@/hooks/use-sound-player"
import { formatDateTime, formatTime } from "@/i18n/format"
import { useSessionMimicry } from "@/screens/Report/hooks/use-session-mimicry"
import { useAccountStore } from "@/stores/account"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors } from "@/theme"
import type { ReportStackParamList, RootStackParamList } from "@/types/navigation"

export function SessionDetailScreen() {
	const { t } = useTranslation()

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const { params } = useRoute<RouteProp<ReportStackParamList, "SessionDetail">>()

	const locale = useDeviceSettingsStore((state) => state.locale)
	const isAnonymous = useAccountStore((account) => account.isAnonymous)

	const insets = useSafeAreaInsets()

	const player = useSoundPlayer()

	const mimicry = useSessionMimicry(params.sessionId)

	const formatSoundTime = mimicry.multiDay ? formatDateTime : formatTime

	function renderBody() {
		if (isAnonymous) {
			return (
				<View style={styles.locked}>
					<Copy style={styles.none}>{t("auth.signInRequired")}</Copy>
					<Button
						label={t("auth.signIn")}
						variant="secondary"
						onPress={() => navigation.navigate("Login")}
					/>
				</View>
			)
		}

		if (mimicry.loadFailed) {
			return <ScreenError message={t("common.loadError")} onRetry={mimicry.refresh} />
		}

		if (mimicry.loading) {
			return <Skeleton rows={4} />
		}

		return (
			<FlatList
				data={mimicry.judging ? [] : mimicry.sounds}
				keyExtractor={(item) => item.sound.id}
				renderItem={({ item }) => (
					<SoundRow
						sound={item.sound}
						wordName={item.wordName}
						timeLabel={formatSoundTime(item.sound.captured_at, locale)}
						player={player}
					/>
				)}
				extraData={[player.playingId, player.failedId]}
				refreshing={mimicry.refreshing}
				onRefresh={mimicry.refresh}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
				ListEmptyComponent=<EmptyState
					message={t(mimicry.judging ? "report.detail.judging" : "report.detail.none")}
				/>
			/>
		)
	}

	return (
		<Screen scroll={false}>
			<View style={styles.content}>
				<ScreenHeader onBack={() => navigation.goBack()} />
				{renderBody()}
			</View>
		</Screen>
	)
}

const styles = StyleSheet.create({
	content: {
		flex: 1,
		paddingHorizontal: 24,
		paddingTop: 20,
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
	},
	none: { color: colors.muted },
	locked: { gap: 12 },
})

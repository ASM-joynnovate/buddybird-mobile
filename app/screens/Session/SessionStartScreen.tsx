import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { PermissionDialog } from "@/components/dialogs/permission-dialog"
import { Illustration } from "@/components/illustration"
import { Button } from "@/components/ui/button"
import { ScreenHeader } from "@/components/ui/header"
import { IconButton } from "@/components/ui/icon-button"
import { GroupedList, SwitchRow } from "@/components/ui/rows"
import { Screen } from "@/components/ui/screen"
import { EmptyState, ScreenError, Skeleton } from "@/components/ui/states"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { wordsQueryOptions } from "@/hooks/apis/words"
import { usePermission } from "@/hooks/use-permission"
import { useSoundPlayer } from "@/hooks/use-sound-player"
import { SleepEditor } from "@/screens/Session/components/sleep-editor"
import { StartDialogs } from "@/screens/Session/components/start-dialogs"
import { selectableWords, WordPicker } from "@/screens/Session/components/word-picker"
import { cameraGranted, useStartSession } from "@/screens/Session/hooks/use-start-session"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors } from "@/theme"
import type { RootStackParamList, SessionDraft } from "@/types/navigation"

export function SessionStartScreen() {
	const { t } = useTranslation()

	const insets = useSafeAreaInsets()

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const { params } = useRoute<RouteProp<RootStackParamList, "SessionStart">>()

	const words = useQuery(wordsQueryOptions())

	const guides = useDeviceSettingsStore((state) => state.guides)

	const microphone = usePermission("microphone")

	const player = useSoundPlayer()

	const [wordId, setWordId] = useState<string | null>(null)
	const [learning, setLearning] = useState(true)

	const starter = useStartSession((sessionId) => navigation.replace("SessionRun", { sessionId }))

	const available = selectableWords(words.data ?? [])
	const selected = available.some((word) => word.id === wordId) ? wordId : null

	function begin() {
		const draft: SessionDraft = {
			wordId: learning ? selected : null,
			learningEnabled: learning,
			replaceRunning: params?.replaceRunning ?? false,
		}

		player.stop()

		void microphone.run(() => void proceed(draft))
	}

	async function proceed(draft: SessionDraft) {
		if (!guides.placement) {
			navigation.navigate("PlacementGuide", { source: "start", draft })
		} else if (await cameraGranted()) {
			navigation.navigate("CameraSetup", { draft })
		} else {
			starter.start(draft)
		}
	}

	const settings = (
		<View style={styles.settings}>
			<GroupedList>
				<SwitchRow
					first
					label={t("session.start.learning")}
					value={learning}
					onChange={setLearning}
				/>
				<SleepEditor />
			</GroupedList>
		</View>
	)

	let body = <Skeleton rows={4} />

	if (words.isError) {
		body = <ScreenError message={t("common.loadError")} onRetry={() => void words.refetch()} />
	} else if (words.data && available.length === 0) {
		body = (
			<WordPicker
				words={[]}
				selectedId={null}
				player={player}
				onSelect={setWordId}
				header=<EmptyState
					message={t("session.start.empty")}
					illustration=<Illustration
						scene={t("session.start.emptyScene")}
						icon="words"
						height={160}
					/>
					action={{
						label: t("session.start.addWord"),
						onPress: () =>
							navigation.popTo("Main", {
								screen: "WordsTab",
								params: { screen: "WordEditor" },
							}),
					}}
				/>
				footer={settings}
			/>
		)
	} else if (words.data) {
		body = (
			<WordPicker
				words={words.data}
				selectedId={selected}
				disabled={!learning}
				player={player}
				onSelect={setWordId}
				header={<Copy style={ui.label}>{t("session.start.wordLabel")}</Copy>}
				footer={settings}
			/>
		)
	}

	return (
		<Screen scroll={false}>
			<View style={[styles.screen, { paddingBottom: insets.bottom + 20 }]}>
				<ScreenHeader
					title={t("session.start.title")}
					onBack={() => navigation.goBack()}
					right=<IconButton
						icon="help"
						label={t("session.start.placementHelp")}
						color={colors.muted}
						onPress={() => navigation.navigate("PlacementGuide", { source: "help" })}
					/>
				/>
				<View style={styles.body}>{body}</View>
				<Button
					label={t("common.start")}
					icon="play"
					loading={starter.busy}
					disabled={!words.data || (learning && !selected)}
					onPress={begin}
				/>
			</View>
			<StartDialogs state={starter} />
			<PermissionDialog {...microphone.dialog} />
		</Screen>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
		paddingHorizontal: 24,
		paddingTop: 12,
		gap: 12,
	},
	body: { flex: 1, minHeight: 0 },
	settings: { marginTop: 10 },
})

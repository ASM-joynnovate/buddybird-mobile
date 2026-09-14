import { useNavigation } from "@react-navigation/native"

import { useTranslation } from "react-i18next"

import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native"

import { TextField } from "@/components/ui/text-field"

import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { InlineError } from "@/components/ui/inline-error"
import { Screen } from "@/components/ui/screen"
import { ui } from "@/components/ui/styles"
import { Copy, Title } from "@/components/ui/text"
import { CategorySelector } from "@/screens/Words/components/category-selector"
import { RecordingPanel } from "@/screens/Words/components/recording-panel"
import { RecordingReview } from "@/screens/Words/components/recording-review"
import { useWordEditor } from "@/screens/Words/hooks/use-word-editor"
import { colors, font } from "@/theme"
import { WORD_NAME_LIMIT } from "@/types/word"

export function WordEditorScreen() {
	const { t } = useTranslation()
	const navigation = useNavigation()
	const {
		label,
		setLabel,
		category,
		setCategory,
		recorded,
		error,
		busy,
		recordingState,
		playing,
		playbackSeconds,
		toggleRecording,
		preview,
		save,
		saveDisabled,
	} = useWordEditor()

	return (
		<KeyboardAvoidingView
			style={styles.screen}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			<Screen scroll={false}>
				<View style={styles.headingContent}>
					<View style={styles.header}>
						<IconButton
							icon="back"
							label={t("common.back")}
							onPress={() => navigation.goBack()}
							disabled={busy}
						/>
						<Copy style={styles.headerText}>{t("words.editTitle")}</Copy>
					</View>

					<Title>{t("words.recordTitle")}</Title>
					<Copy style={ui.subtitle}>{t("words.recordHint")}</Copy>
				</View>
				<ScrollView
					keyboardShouldPersistTaps="handled"
					keyboardDismissMode="on-drag"
					contentContainerStyle={styles.body}
				>
					<TextField
						testID="word-name"
						label={t("words.label")}
						value={label}
						onChangeText={setLabel}
						maxLength={WORD_NAME_LIMIT}
						editable={!busy}
						placeholder={t("words.labelHint")}
					/>

					<Copy style={[ui.label, ui.section]}>{t("words.category")}</Copy>
					<CategorySelector category={category} setCategory={setCategory} />

					<RecordingPanel
						category={category}
						label={label}
						isRecording={recordingState.isRecording}
						durationMillis={
							recordingState.isRecording ? recordingState.durationMillis : 0
						}
						metering={recordingState.metering}
						recorded={!!recorded}
						busy={busy}
						toggleRecording={toggleRecording}
					/>

					<InlineError message={error} />

					{recorded && !recordingState.isRecording ? (
						<RecordingReview
							category={category}
							playing={playing}
							elapsedSeconds={playbackSeconds}
							preview={preview}
						/>
					) : null}

					<View style={[ui.actions, styles.actions]}>
						<Button
							label={t("common.cancel")}
							variant="secondary"
							disabled={busy}
							onPress={() => navigation.goBack()}
							style={ui.action}
						/>
						<Button
							testID="word-save"
							label={t("words.addToTraining")}
							loading={busy}
							disabled={saveDisabled}
							onPress={() => void save()}
							style={ui.action}
						/>
					</View>
				</ScrollView>
			</Screen>
		</KeyboardAvoidingView>
	)
}

const styles = StyleSheet.create({
	headingContent: {
		paddingHorizontal: 20,
		paddingTop: 8,
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
	},
	body: {
		paddingHorizontal: 20,
		paddingTop: 8,
		paddingBottom: 24,
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
	},
	screen: { flex: 1, backgroundColor: colors.background },
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginLeft: -8,
		marginBottom: 10,
	},
	headerText: { flexShrink: 1, fontFamily: font.extraBold, fontSize: 13, color: colors.muted },
	actions: { marginTop: 28 },
})

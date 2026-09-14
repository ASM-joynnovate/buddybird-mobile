import { useTranslation } from "react-i18next"

import { StyleSheet } from "react-native"

import { SessionFailureNotice } from "@/components/session-failure"
import { Button } from "@/components/ui/button"
import { InlineError } from "@/components/ui/inline-error"
import { Screen } from "@/components/ui/screen"
import { ui } from "@/components/ui/styles"
import { Copy, Title } from "@/components/ui/text"
import { CustomDurationPicker } from "@/screens/Learning/components/custom-duration-picker"
import { DurationBreakdown } from "@/screens/Learning/components/duration-breakdown"
import { DurationChoices } from "@/screens/Learning/components/duration-choices"
import { WordList } from "@/screens/Learning/components/word-list"
import { useLearningSetup } from "@/screens/Learning/hooks/use-learning-setup"

export function LearningScreen() {
	const { t } = useTranslation()
	const {
		locale,
		words,
		word,
		setWordId,
		choice,
		choose,
		timing,
		customMinutes,
		changeCustomHours,
		changeCustomMinutes,
		start,
		startDisabled,
		errorMessage,
		failure,
		busy,
	} = useLearningSetup()

	return (
		<Screen>
			<Title>{t("learning.title")}</Title>
			<Copy style={ui.subtitle}>{t("learning.subtitle")}</Copy>

			<Copy accessibilityRole="header" style={ui.sectionTitle}>
				{t("learning.words")}
			</Copy>
			<WordList words={words} selectedId={word?.id} onSelect={setWordId} />
			{!word ? <Copy style={ui.subtitle}>{t("learning.noWords")}</Copy> : null}

			<Copy accessibilityRole="header" style={[ui.sectionTitle, ui.section]}>
				{t("learning.time")}
			</Copy>
			<DurationChoices
				choice={choice}
				choose={choose}
				totalDurationSeconds={timing.totalDurationSeconds}
				locale={locale}
			/>

			{choice === "custom" ? (
				<CustomDurationPicker
					customMinutes={customMinutes}
					changeCustomHours={changeCustomHours}
					changeCustomMinutes={changeCustomMinutes}
				/>
			) : null}

			<DurationBreakdown timing={timing} locale={locale} />

			<InlineError message={errorMessage} />
			<SessionFailureNotice failure={failure} />
			<Button
				testID="learning-start"
				label={t("learning.start")}
				accessibilityLabel={startDisabled ? t("learning.choose") : t("learning.start")}
				icon="play"
				disabled={startDisabled}
				loading={busy}
				onPress={() => void start()}
				style={styles.start}
			/>
		</Screen>
	)
}

const styles = StyleSheet.create({
	start: { marginTop: 22 },
})

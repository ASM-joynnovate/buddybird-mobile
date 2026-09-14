import { useTranslation } from "react-i18next"

import { StyleSheet, View } from "react-native"

import { ChoiceCard } from "@/components/ui/surface"
import { Icon } from "@/components/ui/icon"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { durationText } from "@/i18n/duration"
import { choices, DurationChoice, presetMinutes } from "@/screens/Learning/durations"
import { colors, font, radius } from "@/theme"
import type { Locale } from "@/types/locale"

export function DurationChoices({
	choice,
	choose,
	totalDurationSeconds,
	locale,
}: {
	choice: DurationChoice
	choose(choice: DurationChoice): void
	totalDurationSeconds: number
	locale: Locale
}) {
	const { t } = useTranslation()

	return (
		<>
			{choices.map((item) => {
				const seconds = item === "custom" ? totalDurationSeconds : presetMinutes[item] * 60
				const duration =
					seconds === 0
						? `0${locale === "ko" ? "분" : "m"}`
						: durationText(seconds, locale)

				return (
					<ChoiceCard
						key={item}
						testID={`duration-${item}`}
						accessibilityRole="radio"
						selected={choice === item}
						accessibilityLabel={`${t(`learning.${item}`)}, ${duration}`}
						onPress={() => choose(item)}
						style={styles.spacing}
						contentStyle={styles.choice}
					>
						<View style={[styles.radio, choice === item && styles.radioSelected]}>
							{choice === item ? (
								<Icon name="check" size={15} color={colors.onAccent} />
							) : null}
						</View>
						<View style={styles.choiceText}>
							<View style={ui.row}>
								<Copy style={styles.choiceTitle}>{t(`learning.${item}`)}</Copy>
								<Copy style={styles.duration}>{duration}</Copy>
							</View>
							<Copy style={styles.choiceHint}>{t(`learning.${item}Hint`)}</Copy>
						</View>
					</ChoiceCard>
				)
			})}
		</>
	)
}

const styles = StyleSheet.create({
	spacing: { marginBottom: 12 },
	choice: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		minHeight: 86,
	},
	radio: {
		width: 25,
		height: 25,
		borderRadius: radius.control,
		borderWidth: 3,
		borderColor: colors.border,
		alignItems: "center",
		justifyContent: "center",
	},
	radioSelected: { borderColor: colors.orange, backgroundColor: colors.orange },
	choiceText: { flex: 1 },
	choiceTitle: { fontFamily: font.black, fontSize: 21 },
	duration: { fontSize: 17, color: colors.orange, fontFamily: font.extraBold, flexShrink: 1 },
	choiceHint: { color: colors.muted, fontSize: 15, marginTop: 7, lineHeight: 21 },
})

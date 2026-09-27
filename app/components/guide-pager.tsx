import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { ChevronLeftIcon, type LucideIcon } from "lucide-react-native"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { BackHandler, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { BuddySays } from "@/components/buddy-says"
import { Illustration } from "@/components/illustration"
import { Button } from "@/components/ui/button"
import { GroupedListCheckItem } from "@/components/ui/grouped-list/check-item"
import { IconButton } from "@/components/ui/icon-button"
import { PageDots } from "@/components/ui/page-dots"
import { Screen } from "@/components/ui/screen"
import { TextButton } from "@/components/ui/text-button"
import { contentMaxWidth } from "@/theme"

export type GuideStep = { title: string; scene: string; icon: LucideIcon }

interface Props {
	steps: readonly GuideStep[]
	actions: { finish(): void; skip?(): void; back?(): void }
	dontShowAgain?: { value: boolean; onChange(value: boolean): void }
	finishLabel?: string
}

export function GuidePager({ steps, actions, dontShowAgain, finishLabel }: Props) {
	const { t } = useTranslation()

	const navigation = useNavigation()

	const insets = useSafeAreaInsets()

	const [index, setIndex] = useState(0)

	const step = steps[index]
	const last = index === steps.length - 1
	const back = index > 0 ? () => setIndex(index - 1) : actions.back

	useEffect(() => {
		navigation.setOptions({ gestureEnabled: index === 0 })
	}, [index, navigation])

	useFocusEffect(
		useCallback(() => {
			if (index === 0) {
				return
			}

			const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
				setIndex(index - 1)

				return true
			})

			return () => subscription.remove()
		}, [index]),
	)

	return (
		<Screen scroll={false}>
			<View style={[styles.screen, { paddingBottom: insets.bottom + 20 }]}>
				<View style={styles.top}>
					{back ? (
						<IconButton
							icon={ChevronLeftIcon}
							label={t("common.back")}
							onPress={back}
						/>
					) : null}
					<PageDots
						count={steps.length}
						index={index}
						label={t("common.step", { current: index + 1, total: steps.length })}
					/>
					<View style={styles.spacer} />
					{actions.skip ? (
						<TextButton label={t("common.skip")} tone="muted" onPress={actions.skip} />
					) : null}
				</View>
				<View style={styles.body}>
					<BuddySays message={step.title} />
					<Illustration scene={step.scene} icon={step.icon} height={260} mascot={false} />
				</View>
				<View style={styles.bottom}>
					{dontShowAgain ? (
						<GroupedListCheckItem
							first
							label={t("common.dontShowAgain")}
							checked={dontShowAgain.value}
							onToggle={() => dontShowAgain.onChange(!dontShowAgain.value)}
						/>
					) : null}
					<Button
						label={last ? (finishLabel ?? t("common.start")) : t("common.next")}
						onPress={() => (last ? actions.finish() : setIndex(index + 1))}
					/>
				</View>
			</View>
		</Screen>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		width: "100%",
		maxWidth: contentMaxWidth,
		alignSelf: "center",
		paddingHorizontal: 24,
		paddingTop: 12,
	},
	top: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 4 },
	spacer: { flex: 1 },
	body: { flex: 1, justifyContent: "space-between", gap: 24, paddingTop: 16, paddingBottom: 24 },
	bottom: { gap: 12 },
})

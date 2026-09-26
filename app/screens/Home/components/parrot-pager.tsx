import type { TFunction } from "i18next"
import { type ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, Image, type LayoutChangeEvent, StyleSheet, View } from "react-native"

import { PageDots } from "@/components/ui/badge"
import { Icon } from "@/components/ui/icon"
import { PressableSurface } from "@/components/ui/surface"
import { Copy, Title } from "@/components/ui/text"
import { colors, font, radius } from "@/theme"
import type { Parrot } from "@/types/apis/parrots"
import { ageMonths } from "@/utils/date"
import { MONTHS_PER_YEAR } from "@/utils/units"

const INFO_HEIGHT = 96

function ageText(birthdate: string | null, t: TFunction): string | null {
	const months = ageMonths(birthdate)

	if (months === null) {
		return null
	}

	if (months < MONTHS_PER_YEAR) {
		return t("home.parrot.months", { count: months })
	}

	return t("home.parrot.years", { count: Math.floor(months / MONTHS_PER_YEAR) })
}

export function ParrotPager({
	parrots,
	onOpen,
}: {
	parrots: readonly Parrot[]
	onOpen(id: string): void
}) {
	const { t } = useTranslation()

	const [size, setSize] = useState({ width: 0, height: 0 })
	const [index, setIndex] = useState(0)

	function measure(event: LayoutChangeEvent) {
		const { width, height } = event.nativeEvent.layout

		setSize({ width, height })
	}

	return (
		<View style={styles.frame} onLayout={measure}>
			{size.width > 0 ? (
				<FlatList
					data={parrots}
					horizontal
					pagingEnabled
					showsHorizontalScrollIndicator={false}
					keyExtractor={(parrot) => parrot.id}
					onMomentumScrollEnd={(event) =>
						setIndex(Math.round(event.nativeEvent.contentOffset.x / size.width))
					}
					renderItem={({ item }) => (
						<View style={{ width: size.width, height: size.height }}>
							<ParrotCard
								parrot={item}
								photoHeight={Math.max(0, size.height - INFO_HEIGHT)}
								dots=<PageDots
									count={parrots.length}
									index={index}
									label={t("home.parrot.page", {
										current: index + 1,
										total: parrots.length,
									})}
								/>
								onOpen={onOpen}
							/>
						</View>
					)}
				/>
			) : null}
		</View>
	)
}

function ParrotCard({
	parrot,
	photoHeight,
	dots,
	onOpen,
}: {
	parrot: Parrot
	photoHeight: number
	dots: ReactNode
	onOpen(id: string): void
}) {
	const { t } = useTranslation()
	const species = t(`parrot.speciesNames.${parrot.species}`, { defaultValue: parrot.species })
	const meta = [species, ageText(parrot.birthdate, t)].filter(Boolean).join(", ")

	return (
		<PressableSurface
			depth={2}
			style={styles.card}
			contentStyle={styles.cardFace}
			accessibilityLabel={t("home.parrot.edit", { name: parrot.name })}
			onPress={() => onOpen(parrot.id)}
		>
			{parrot.photo ? (
				<Image
					source={{ uri: parrot.photo.url }}
					style={[styles.photo, { height: photoHeight }]}
					accessibilityIgnoresInvertColors
				/>
			) : (
				<View style={[styles.photo, styles.empty, { height: photoHeight }]}>
					<Icon name="photo" size={40} color={colors.muted} />
					<Copy style={styles.addPhoto}>{t("home.parrot.addPhoto")}</Copy>
				</View>
			)}
			<View style={styles.info}>
				<View style={styles.names}>
					<Title style={styles.name}>{parrot.name}</Title>
					<Copy numberOfLines={1} style={styles.meta}>
						{meta}
					</Copy>
				</View>
				{dots}
			</View>
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	frame: { flex: 1, minHeight: 0 },
	card: { flex: 1 },
	cardFace: { flex: 1, padding: 10, gap: 8 },
	photo: { width: "100%", borderRadius: radius.control, backgroundColor: colors.surface },
	empty: { alignItems: "center", justifyContent: "center", gap: 8 },
	addPhoto: { fontFamily: font.extraBold, fontSize: 15, color: colors.text },
	info: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 6 },
	names: { flex: 1, minWidth: 0 },
	name: { fontSize: 22, lineHeight: 28 },
	meta: { fontSize: 14, color: colors.muted },
})

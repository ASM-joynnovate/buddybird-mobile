import { useTranslation } from "react-i18next"

import { ScrollView, StyleSheet, View } from "react-native"

import { categoryColors } from "@/theme"

import { Chip } from "@/components/ui/chip"
import { filters, type WordFilter } from "@/screens/Words/filters"

export function WordFilters({
	filter,
	changeFilter,
}: {
	filter: WordFilter
	changeFilter(filter: WordFilter): void
}) {
	const { t } = useTranslation()

	return (
		<View style={styles.filterArea}>
			<ScrollView
				style={styles.scroll}
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.filters}
			>
				{filters.map((item) => (
					<Chip
						key={item}
						testID={`word-filter-${item}`}
						label={t(`categories.${item}`)}
						selected={filter === item}
						tone={item === "all" ? "primary" : categoryColors[item].tone}
						onPress={() => changeFilter(item)}
					/>
				))}
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	scroll: { flexGrow: 0 },
	filterArea: { width: "100%", maxWidth: 480, alignSelf: "center" },
	filters: { paddingHorizontal: 22, paddingBottom: 10, gap: 8 },
})

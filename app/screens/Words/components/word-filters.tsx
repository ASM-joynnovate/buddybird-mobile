import { useTranslation } from "react-i18next"

import { ScrollView, StyleSheet, View } from "react-native"

import { Chip } from "@/components/ui/chip"
import { filters, WordFilter } from "@/screens/Words/filters"

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
						onPress={() => changeFilter(item)}
					/>
				))}
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	filterArea: { width: "100%", maxWidth: 680, alignSelf: "center" },
	filters: { paddingHorizontal: 22, paddingBottom: 10, gap: 8 },
})

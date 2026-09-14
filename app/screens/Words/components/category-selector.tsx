import { useTranslation } from "react-i18next"

import { View } from "react-native"

import { Chip } from "@/components/ui/chip"
import { ui } from "@/components/ui/styles"
import { categoryColors } from "@/theme"
import { Word } from "@/types/word"
const categories: Word["tag"][] = ["greeting", "food", "name", "etc"]

export function CategorySelector({
	category,
	setCategory,
}: {
	category: Word["tag"]
	setCategory(category: Word["tag"]): void
}) {
	const { t } = useTranslation()

	return (
		<View style={ui.wrap}>
			{categories.map((item) => (
				<Chip
					key={item}
					testID={`word-category-${item}`}
					label={t(`categories.${item}`)}
					selected={category === item}
					tone={categoryColors[item].tone}
					onPress={() => setCategory(item)}
				/>
			))}
		</View>
	)
}

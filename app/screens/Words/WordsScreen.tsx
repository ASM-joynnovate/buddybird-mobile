import { useNavigation } from "@react-navigation/native"

import { NativeStackNavigationProp } from "@react-navigation/native-stack"

import { useTranslation } from "react-i18next"

import { FlatList, StyleSheet, View } from "react-native"

import { IconButton } from "@/components/ui/icon-button"
import { InlineError } from "@/components/ui/inline-error"
import { Screen } from "@/components/ui/screen"
import { Title } from "@/components/ui/text"
import { EmptyWords } from "@/screens/Words/components/empty-words"
import { WordFilters } from "@/screens/Words/components/word-filters"
import { WordListItem } from "@/screens/Words/components/word-list-item"
import { useWordLibrary } from "@/screens/Words/hooks/use-word-library"
import { colors } from "@/theme"
import type { RootStackParamList } from "@/types/navigation"

export function WordsScreen() {
	const { t } = useTranslation()
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const {
		filter,
		changeFilter,
		filteredWords,
		error,
		playingId,
		playing,
		preview,
		confirmDelete,
	} = useWordLibrary()

	return (
		<Screen scroll={false}>
			<View style={styles.header}>
				<Title style={styles.title}>{t("words.title")}</Title>
				<IconButton
					testID="word-add"
					icon="plus"
					label={t("words.add")}
					onPress={() => navigation.navigate("WordEditor")}
					size={50}
					tone="primary"
					color={colors.onAccent}
				/>
			</View>

			<WordFilters filter={filter} changeFilter={changeFilter} />

			<View style={styles.error}>
				<InlineError message={error} />
			</View>

			<FlatList
				data={filteredWords}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.list}
				ListEmptyComponent={<EmptyWords />}
				renderItem={({ item }) => (
					<WordListItem
						item={item}
						isPlaying={playingId === item.id && playing}
						preview={preview}
						confirmDelete={confirmDelete}
					/>
				)}
			/>
		</Screen>
	)
}

const styles = StyleSheet.create({
	header: {
		paddingHorizontal: 22,
		paddingTop: 12,
		paddingBottom: 18,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
	},
	title: { flex: 1 },
	error: { paddingHorizontal: 22 },
	list: {
		padding: 24,
		paddingTop: 10,
		flexGrow: 1,
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
	},
})

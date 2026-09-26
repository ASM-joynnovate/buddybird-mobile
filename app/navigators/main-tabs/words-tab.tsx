import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { stackOptions } from "@/navigators/main-tabs/stack-options"
import { WordEditorScreen } from "@/screens/Words/WordEditorScreen"
import { WordListScreen } from "@/screens/Words/WordListScreen"
import type { WordsStackParamList } from "@/types/navigation"

const WordsStack = createNativeStackNavigator<WordsStackParamList>()

export function WordsTab() {
	return (
		<WordsStack.Navigator screenOptions={stackOptions}>
			<WordsStack.Screen name="WordList" component={WordListScreen} />
			<WordsStack.Screen name="WordEditor" component={WordEditorScreen} />
		</WordsStack.Navigator>
	)
}

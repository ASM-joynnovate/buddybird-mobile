import type { WordsStackParamList } from '@/types/navigation';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { stackOptions } from '@/navigators/main-tabs/stack-options';
import WordEditorScreen from '@/screens/words/word-editor-screen';
import WordListScreen from '@/screens/words/word-list-screen';

const WordsStack = createNativeStackNavigator<WordsStackParamList>();

/** 단어 탭 navigator 컴포넌트 */
const WordsTab = () => {
	return (
		<WordsStack.Navigator screenOptions={stackOptions}>
			<WordsStack.Screen name="WordList" component={WordListScreen} />
			<WordsStack.Screen name="WordEditor" component={WordEditorScreen} />
		</WordsStack.Navigator>
	);
};

export default WordsTab;

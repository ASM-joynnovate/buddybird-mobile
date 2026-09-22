import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { TabBar } from "@/components/navigation/tab-bar"
import { HomeScreen } from "@/screens/Home/HomeScreen"
import { NotificationsScreen } from "@/screens/Home/NotificationsScreen"
import { AccountEditorScreen } from "@/screens/Profile/AccountEditorScreen"
import { ProfileScreen } from "@/screens/Profile/ProfileScreen"
import { EmergencyDetailScreen } from "@/screens/Records/EmergencyDetailScreen"
import { RecordsScreen } from "@/screens/Records/RecordsScreen"
import { SessionDetailScreen } from "@/screens/Records/SessionDetailScreen"
import { ReportScreen } from "@/screens/Report/ReportScreen"
import { SessionMonitorScreen } from "@/screens/Session/SessionMonitorScreen"
import { WordEditorScreen } from "@/screens/Words/WordEditorScreen"
import { WordListScreen } from "@/screens/Words/WordListScreen"
import { colors } from "@/theme"
import type {
	HomeStackParamList,
	MainTabParamList,
	ProfileStackParamList,
	RecordsStackParamList,
	ReportStackParamList,
	WordsStackParamList,
} from "@/types/navigation"

const Tabs = createBottomTabNavigator<MainTabParamList>()
const HomeStack = createNativeStackNavigator<HomeStackParamList>()
const WordsStack = createNativeStackNavigator<WordsStackParamList>()
const ReportStack = createNativeStackNavigator<ReportStackParamList>()
const RecordsStack = createNativeStackNavigator<RecordsStackParamList>()
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>()

const stackOptions = {
	headerShown: false,
	contentStyle: { backgroundColor: colors.background },
} as const

function HomeTab() {
	return (
		<HomeStack.Navigator screenOptions={stackOptions}>
			<HomeStack.Screen name="Home" component={HomeScreen} />
			<HomeStack.Screen name="Notifications" component={NotificationsScreen} />
			<HomeStack.Screen name="SessionMonitor" component={SessionMonitorScreen} />
		</HomeStack.Navigator>
	)
}

function WordsTab() {
	return (
		<WordsStack.Navigator screenOptions={stackOptions}>
			<WordsStack.Screen name="WordList" component={WordListScreen} />
			<WordsStack.Screen name="WordEditor" component={WordEditorScreen} />
		</WordsStack.Navigator>
	)
}

function ReportTab() {
	return (
		<ReportStack.Navigator screenOptions={stackOptions}>
			<ReportStack.Screen name="Report" component={ReportScreen} />
		</ReportStack.Navigator>
	)
}

function RecordsTab() {
	return (
		<RecordsStack.Navigator screenOptions={stackOptions}>
			<RecordsStack.Screen name="Records" component={RecordsScreen} />
			<RecordsStack.Screen name="SessionDetail" component={SessionDetailScreen} />
			<RecordsStack.Screen name="EmergencyDetail" component={EmergencyDetailScreen} />
		</RecordsStack.Navigator>
	)
}

function ProfileTab() {
	return (
		<ProfileStack.Navigator screenOptions={stackOptions}>
			<ProfileStack.Screen name="Profile" component={ProfileScreen} />
			<ProfileStack.Screen name="AccountEditor" component={AccountEditorScreen} />
		</ProfileStack.Navigator>
	)
}

export function MainTabs() {
	return (
		<Tabs.Navigator
			screenOptions={{
				headerShown: false,
				sceneStyle: { backgroundColor: colors.background },
			}}
			tabBar={(props) => <TabBar {...props} />}
		>
			<Tabs.Screen name="HomeTab" component={HomeTab} />
			<Tabs.Screen name="WordsTab" component={WordsTab} />
			<Tabs.Screen name="ReportTab" component={ReportTab} />
			<Tabs.Screen name="RecordsTab" component={RecordsTab} />
			<Tabs.Screen name="ProfileTab" component={ProfileTab} />
		</Tabs.Navigator>
	)
}

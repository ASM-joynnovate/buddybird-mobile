import { useEffect, useState } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import {
  NavigationContainer,
  StackActions,
  useNavigationContainerRef,
} from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { BottomTabBarProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { useTranslation } from "react-i18next"

import { useAppData } from "@/context/AppContext"
import { useSession } from "@/context/SessionContext"
import { track } from "@/services/telemetry"
import { LearningScreen } from "@/screens/Learning/LearningScreen"
import { WordsScreen } from "@/screens/Words/WordsScreen"
import { WordEditorScreen } from "@/screens/Words/WordEditorScreen"
import { ProfileScreen } from "@/screens/Profile/ProfileScreen"
import { OnboardingScreen, ProfileEditorScreen } from "@/screens/Profile/ProfileForm"
import { SessionScreen } from "@/screens/Session/SessionScreen"
import { Copy } from "@/components/ui"
import { Icon, IconName } from "@/components/Icon"
import { colors, font } from "@/theme"
import { MainTabParamList, RootStackParamList } from "@/navigators/types"

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tabs = createBottomTabNavigator<MainTabParamList>()
const icons: Record<keyof MainTabParamList, IconName> = {
  Learn: "learn",
  Words: "book",
  Profile: "profile",
}

function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  const { t } = useTranslation()

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route, index) => {
        const selected = state.index === index
        const tabName = route.name.toLowerCase()
        const tabLabel = t(`tabs.${tabName}`)

        function selectTab() {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          })

          if (selected || event.defaultPrevented) {
            return
          }

          track("tab_switched", {
            from: state.routes[state.index].name.toLowerCase(),
            to: tabName,
          })
          navigation.navigate(route.name, route.params)
        }

        return (
          <Pressable
            key={route.key}
            testID={`tab-${tabName}`}
            accessibilityRole="tab"
            accessibilityLabel={tabLabel}
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.tab,
              selected && styles.selectedTab,
              pressed && { opacity: 0.7 },
            ]}
            onPress={selectTab}
          >
            <Icon
              name={icons[route.name as keyof MainTabParamList]}
              color={selected ? "#3c2600" : colors.muted}
              size={25}
            />
            <Copy style={[styles.tabLabel, selected && { color: "#3c2600" }]}>{tabLabel}</Copy>
          </Pressable>
        )
      })}
    </View>
  )
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="Learn" component={LearningScreen} />
      <Tabs.Screen name="Words" component={WordsScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  )
}

export function AppNavigator() {
  const data = useAppData()
  const { snapshot } = useSession()
  const navigation = useNavigationContainerRef<RootStackParamList>()

  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState<string | null>(null)

  const hasProfile = Boolean(data.profile)

  useEffect(() => {
    if (!ready || !hasProfile || !navigation.isReady()) {
      return
    }

    const shouldShowSession = [
      "starting",
      "running",
      "paused",
      "interrupted",
      "stopping",
      "completed",
    ].includes(snapshot.state)

    if (
      shouldShowSession &&
      snapshot.sessionId !== dismissed &&
      navigation.getCurrentRoute()?.name !== "Session"
    ) {
      navigation.navigate("Session")
    }

    if (snapshot.state === "idle" && navigation.getCurrentRoute()?.name === "Session") {
      navigation.goBack()
    }
  }, [ready, hasProfile, snapshot.state, snapshot.sessionId, dismissed, navigation])

  function continueFromSession() {
    setDismissed(snapshot.sessionId)
    navigation.dispatch(StackActions.popTo("Main"))
  }

  return (
    <NavigationContainer ref={navigation} onReady={() => setReady(true)}>
      <Stack.Navigator
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      >
        {!hasProfile ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="ProfileEditor" component={ProfileEditorScreen} />
            <Stack.Screen name="WordEditor" component={WordEditorScreen} />
            <Stack.Screen name="Session" options={{ animation: "fade" }}>
              {() => <SessionScreen onContinue={continueFromSession} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingTop: 12,
    paddingHorizontal: 15,
    gap: 20,
  },
  tab: {
    minWidth: 64,
    minHeight: 68,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  selectedTab: {
    backgroundColor: colors.orange,
    borderBottomWidth: 4,
    borderColor: colors.orangeDark,
  },
  tabLabel: { fontFamily: font.extraBold, fontSize: 13, color: colors.muted },
})

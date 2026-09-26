import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { stackOptions } from "@/navigators/main-tabs/stack-options"
import { ReportScreen } from "@/screens/Report/ReportScreen"
import { SessionDetailScreen } from "@/screens/Report/SessionDetailScreen"
import type { ReportStackParamList } from "@/types/navigation"

const ReportStack = createNativeStackNavigator<ReportStackParamList>()

export function ReportTab() {
	return (
		<ReportStack.Navigator screenOptions={stackOptions}>
			<ReportStack.Screen name="Report" component={ReportScreen} />
			<ReportStack.Screen name="SessionDetail" component={SessionDetailScreen} />
		</ReportStack.Navigator>
	)
}

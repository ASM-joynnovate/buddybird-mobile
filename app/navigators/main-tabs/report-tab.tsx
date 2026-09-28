import type { ReportStackParamList } from '@/types/navigation';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { stackOptions } from '@/navigators/main-tabs/stack-options';
import ReportScreen from '@/screens/report/report-screen';
import SessionDetailScreen from '@/screens/report/session-detail-screen';

const ReportStack = createNativeStackNavigator<ReportStackParamList>();

/** 리포트 탭 안에서 리포트 화면과 세션 상세 화면을 오가는 컴포넌트 */
const ReportTab = () => {
	return (
		<ReportStack.Navigator screenOptions={stackOptions}>
			<ReportStack.Screen name="Report" component={ReportScreen} />
			<ReportStack.Screen name="SessionDetail" component={SessionDetailScreen} />
		</ReportStack.Navigator>
	);
};

export default ReportTab;

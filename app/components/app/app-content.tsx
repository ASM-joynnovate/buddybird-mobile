import AuthProvider from '@/providers/auth';
import SystemProvider from '@/providers/system';
import UpdateDialogProvider from '@/providers/update-dialog';
import { useDeviceSettingsStore } from '@/stores/device-settings';

import AuthStatusContent from '@/components/app/auth-status-content';
import UsageGuideScreen from '@/components/app/usage-guide';

/** 앱 서비스 및 로그인 시작 컴포넌트 */
const AppContent = () => {
	const usageGuideSeen = useDeviceSettingsStore((state) => state.usageGuideSeen);

	return (
		<SystemProvider>
			<AuthProvider>
				<UpdateDialogProvider>
					{/*처음 설치한 기기는 사용 안내 먼저 표시*/}
					{usageGuideSeen ? <AuthStatusContent /> : <UsageGuideScreen />}
				</UpdateDialogProvider>
			</AuthProvider>
		</SystemProvider>
	);
};

export default AppContent;

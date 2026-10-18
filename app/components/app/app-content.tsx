import AuthProvider from '@/providers/auth';
import MessageProvider from '@/providers/message';
import SystemProvider from '@/providers/system';
import UpdateDialogProvider from '@/providers/update-dialog';
import { useDeviceSettingsStore } from '@/stores/device-settings';

import AuthStatusContent from '@/components/app/auth-status-content';
import UsageGuideScreen from '@/components/app/usage-guide-screen';

/** 앱 서비스와 로그인을 시작하는 컴포넌트 */
const AppContent = () => {
	const usageGuideSeen = useDeviceSettingsStore((state) => state.usageGuideSeen);

	return (
		<SystemProvider>
			<MessageProvider>
				<AuthProvider>
					<UpdateDialogProvider>
						{/*처음 설치한 기기는 사용 안내 먼저 표시*/}
						{usageGuideSeen ? <AuthStatusContent /> : <UsageGuideScreen />}
					</UpdateDialogProvider>
				</AuthProvider>
			</MessageProvider>
		</SystemProvider>
	);
};

export default AppContent;

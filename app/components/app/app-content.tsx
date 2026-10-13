import AuthProvider from '@/providers/auth';
import MessageProvider from '@/providers/message';
import SystemProvider from '@/providers/system';
import UpdateDialogProvider from '@/providers/update-dialog';

import AuthStatusContent from '@/components/app/auth-status-content';

/** 앱 서비스와 로그인을 시작하는 컴포넌트 */
const AppContent = () => {
	return (
		<SystemProvider>
			<MessageProvider>
				<AuthProvider>
					<UpdateDialogProvider>
						<AuthStatusContent />
					</UpdateDialogProvider>
				</AuthProvider>
			</MessageProvider>
		</SystemProvider>
	);
};

export default AppContent;

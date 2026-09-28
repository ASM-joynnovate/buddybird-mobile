import AuthProvider from '@/providers/auth';
import SystemProvider from '@/providers/system';

import AuthStatusContent from '@/components/app/auth-status-content';

interface Props {
	splashFinished: boolean;
}

/**
 * 앱 서비스와 로그인을 준비하고 로그인 상태에 맞는 화면을 보여 주는 컴포넌트
 * @param splashFinished 스플래시 종료 여부
 */
const AppContent = ({ splashFinished }: Props) => {
	return (
		<SystemProvider>
			<AuthProvider>
				<AuthStatusContent splashFinished={splashFinished} />
			</AuthProvider>
		</SystemProvider>
	);
};

export default AppContent;

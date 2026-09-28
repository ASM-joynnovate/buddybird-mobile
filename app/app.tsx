import { useCallback, useState } from 'react';

import useAppBootstrap from '@/hooks/use-app-bootstrap';

import RootProviders from '@/providers';

import AppContent from '@/components/app/app-content';
import AppSplash from '@/components/app/app-splash';
import StartupScreen from '@/components/app/startup-screen';

/** 시작 준비 상태에 맞춰 불러오는 중 표시, 다시 시도 버튼, 첫 화면을 보여 주고 그 위에 스플래시를 덮는 컴포넌트 */
const App = () => {
	const [splashFinished, setSplashFinished] = useState(false);

	const { bootstrapStatus, ready, settled, retry } = useAppBootstrap();

	/** 스플래시 종료 상태로 변경 */
	const handleFinishSplash = useCallback(() => setSplashFinished(true), []);

	if (bootstrapStatus === 'headless') {
		return null;
	}

	return (
		<RootProviders>
			{/*불러오는 중 표시, 다시 시도 버튼, 준비가 끝난 뒤의 첫 화면*/}
			{ready ? (
				<AppContent splashFinished={splashFinished} />
			) : bootstrapStatus === 'failed' ? (
				<StartupScreen onRetry={retry} />
			) : (
				<StartupScreen />
			)}

			{/*눈을 깜빡이는 얼굴 그림과 앱 이름*/}
			{!splashFinished && <AppSplash bootstrapSettled={settled} onComplete={handleFinishSplash} />}
		</RootProviders>
	);
};

export default App;

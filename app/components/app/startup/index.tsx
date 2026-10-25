import { useEffect } from 'react';

import { useAppStore } from '@/stores/app';

interface Props {
	onRetry?: () => void;
}

/**
 * 앱 시작 화면 표시를 요청하는 컴포넌트
 * @param onRetry 다시 시도 버튼을 누를 때 실행할 함수
 */
const StartupScreen = ({ onRetry }: Props) => {
	const setStartupScreen = useAppStore((state) => state.setStartupScreen);

	/** 마운트되어 있는 동안 시작 화면 표시 요청 */
	useEffect(() => {
		setStartupScreen({ onRetry });

		return () => setStartupScreen(null);
	}, [onRetry, setStartupScreen]);

	return null;
};

export default StartupScreen;

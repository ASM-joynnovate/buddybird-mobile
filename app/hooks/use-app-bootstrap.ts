import { useEffect, useState } from 'react';

import { Appearance } from 'react-native';

import { bootstrap } from '@/services/bootstrap';
import { connectQueryLifecycle } from '@/services/lifecycle/query-lifecycle';
import { reportError } from '@/services/telemetry/client';

/** 앱 시작 준비 Hook */
const useAppBootstrap = () => {
	const [bootstrapStatus, setBootstrapStatus] = useState<'loading' | 'ready' | 'failed' | 'headless'>('loading');

	const [retryCount, setRetryCount] = useState(0);

	const settled = bootstrapStatus !== 'loading';
	const ready = bootstrapStatus === 'ready' && settled;

	/** 앱 시작 시 앱 상태 변화를 TanStack Query에 연결 */
	useEffect(connectQueryLifecycle, []);

	/** 앱 시작 시 라이트 모드로 고정 */
	useEffect(() => {
		// 기기가 다크 모드여도 시스템 UI를 라이트 모드 색으로 표시
		Appearance.setColorScheme('light');
	}, []);

	/** 앱 시작 준비 실행 */
	useEffect(() => {
		let active = true;

		void bootstrap()
			.then((status) => {
				if (active) {
					setBootstrapStatus(status);
				}
			})
			.catch((error) => {
				reportError(error, 'bootstrap');

				if (active) {
					setBootstrapStatus('failed');
				}
			});

		return () => {
			active = false;
		};
	}, [retryCount]);

	/** 앱 시작 준비를 다시 시도하는 함수 */
	const retry = () => {
		setBootstrapStatus('loading');
		setRetryCount((prev) => prev + 1);
	};

	return { bootstrapStatus, ready, settled, retry };
};

export default useAppBootstrap;

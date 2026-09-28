import { useEffect, useState } from 'react';

import { Appearance } from 'react-native';

import { bootstrap } from '@/services/bootstrap';
import { connectQueryLifecycle } from '@/services/lifecycle/query-lifecycle';
import { reportError } from '@/services/telemetry/client';

/** 앱을 켤 때 준비 작업을 실행하고 준비 상태와 다시 시도 함수를 돌려주는 훅 */
const useAppBootstrap = () => {
	const [bootstrapStatus, setBootstrapStatus] = useState<'loading' | 'ready' | 'failed' | 'headless'>('loading');

	const [retryCount, setRetryCount] = useState(0);

	const settled = bootstrapStatus !== 'loading';
	const ready = bootstrapStatus === 'ready' && settled;

	/** 앱을 켤 때 앱 전환과 인터넷 연결 상태를 서버 데이터 조회에 반영 */
	useEffect(connectQueryLifecycle, []);

	/** 앱을 켤 때 밝은 모드로 고정 */
	useEffect(() => {
		// 기기가 다크 모드여도 시스템 컨트롤을 앱의 밝은 화면과 같은 색으로 표시
		Appearance.setColorScheme('light');
	}, []);

	/** 앱을 켤 때와 다시 시도할 때 준비 작업 실행과 결과 저장 */
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

	/** 준비 상태를 되돌리고 준비 작업 다시 실행 */
	const retry = () => {
		setBootstrapStatus('loading');
		setRetryCount((prev) => prev + 1);
	};

	return { bootstrapStatus, ready, settled, retry };
};

export default useAppBootstrap;

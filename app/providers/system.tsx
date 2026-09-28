import { type ReactNode, useEffect } from 'react';

import { changeI18nLocale } from '@/i18n';

import { startAppServices } from '@/services/lifecycle/app-services';
import { reportError } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';

interface Props {
	children: ReactNode;
}

/**
 * 오류 보고와 분석, 의견 요청 접속일 세기를 시작하고 고른 앱 언어를 적용하는 provider
 * @param children 감싸는 내용
 */
const SystemProvider = ({ children }: Props) => {
	const locale = useDeviceSettingsStore((state) => state.locale);

	/** 앱을 켤 때 오류 보고와 분석 시작, 앱을 열 때마다 의견 요청 접속일 세기 */
	useEffect(startAppServices, []);

	/** 앱 언어 변경 시 i18n 언어 변경 */
	useEffect(() => {
		void changeI18nLocale(locale).catch((error) => reportError(error, 'language_restore'));
	}, [locale]);

	return <>{children}</>;
};

export default SystemProvider;

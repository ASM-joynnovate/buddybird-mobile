import { type ReactNode, useEffect } from 'react';

import { changeI18nLocale } from '@/i18n';

import { startAppServices } from '@/services/lifecycle/app-services';
import { reportError } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';

interface Props {
	children: ReactNode;
}

/**
 * 앱 서비스 시작과 앱 언어 적용 provider
 * @param children 감싸는 내용
 */
const SystemProvider = ({ children }: Props) => {
	const locale = useDeviceSettingsStore((state) => state.locale);

	/** 앱 서비스 시작 */
	useEffect(startAppServices, []);

	/** 앱 언어 변경 시 i18n 언어 변경 */
	useEffect(() => {
		void changeI18nLocale(locale).catch((error) => reportError(error, 'language_restore'));
	}, [locale]);

	return <>{children}</>;
};

export default SystemProvider;

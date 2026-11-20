import { localeDefinitions } from '@/types/locale';

import { useTranslation } from 'react-i18next';

import * as WebBrowser from 'expo-web-browser';
import { FileLockIcon, ScrollTextIcon } from 'lucide-react-native';

import { env } from '@/config/env';
import { reportError } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';

import { Item } from '@/components/ui/item';
import { ItemGroup } from '@/components/ui/item/group';

/** 약관 및 정책 링크 컴포넌트 */
const LegalGroup = () => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const handleOpenDocument = (documentPath: 'terms' | 'privacy') => {
		const documentUrl = `${env.websiteBaseUrl}/${localeDefinitions[locale].websiteLocale}/${documentPath}/`;

		void WebBrowser.openBrowserAsync(documentUrl).catch((error) => reportError(error, 'legal_link'));
	};

	return (
		<ItemGroup title={t('settings.legal.title')}>
			<Item
				isFirstInGroup
				icon={ScrollTextIcon}
				label={t('settings.legal.terms')}
				onPress={() => handleOpenDocument('terms')}
			/>
			<Item
				icon={FileLockIcon}
				label={t('settings.legal.privacy')}
				onPress={() => handleOpenDocument('privacy')}
			/>
		</ItemGroup>
	);
};

export default LegalGroup;

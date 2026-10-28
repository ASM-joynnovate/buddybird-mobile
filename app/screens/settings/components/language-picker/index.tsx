import { useQueryClient } from '@tanstack/react-query';

import type { Locale } from '@/types/locale';

import { useUpdateDevice } from '@/hooks/apis/devices';
import { apiKeys } from '@/hooks/apis/keys';

import { useTranslation } from 'react-i18next';

import { formatLanguageName } from '@/i18n/format';

import { MessageSquareTextIcon } from 'lucide-react-native';

import LanguagePickerList from '@/screens/settings/components/language-picker/list';
import { reportError, setUserProperties, track } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';

import { ItemPicker } from '@/components/ui/item/picker';

/** 앱 언어 선택 컴포넌트 */
const LanguagePicker = () => {
	const queryClient = useQueryClient();

	const { t } = useTranslation();

	const { isPending, mutate: updateDevice } = useUpdateDevice();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const setLocale = useDeviceSettingsStore((state) => state.setLocale);

	const handleSelectLanguage = (nextLocale: Locale, close: () => void) => {
		if (isPending || locale === nextLocale) {
			close();
			return;
		}

		try {
			setLocale(nextLocale);

			updateDevice(
				{ data: { locale: nextLocale } },
				{ onError: (error) => reportError(error, 'device_locale_update') },
			);

			void queryClient.invalidateQueries({ queryKey: apiKeys.all() });

			setUserProperties({ locale: nextLocale });
			track('language_changed', { from: locale, to: nextLocale });
		} catch (e) {
			reportError(e, 'change_language');
		}

		close();
	};

	return (
		<ItemPicker
			itemProps={{
				icon: MessageSquareTextIcon,
				label: t('settings.general.language'),
				value: formatLanguageName(locale),
				isFirstInGroup: true,
				disabled: isPending,
			}}
			sheet={{ title: t('settings.general.language'), listLayout: true }}
		>
			{(close) => (
				<LanguagePickerList
					locale={locale}
					onSelect={(nextLocale) => handleSelectLanguage(nextLocale, close)}
				/>
			)}
		</ItemPicker>
	);
};

export default LanguagePicker;

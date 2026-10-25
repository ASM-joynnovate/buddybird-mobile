import { StyleSheet, View } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';

import { type Locale, locales } from '@/types/locale';

import { useUpdateDevice } from '@/hooks/apis/devices';
import { apiKeys } from '@/hooks/apis/keys';

import { useTranslation } from 'react-i18next';

import type { SettingsMessages } from '@/i18n/types/settings';

import { MessageSquareTextIcon } from 'lucide-react-native';

import { reportError, setUserProperties, track } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';

import { ItemPicker } from '@/components/ui/item/picker';
import { ItemRadio } from '@/components/ui/item/radio';

const LANGUAGE_LABEL_KEYS: Record<Locale, keyof SettingsMessages['general']> = {
	'ko-KR': 'korean',
	'en-US': 'english',
	'ja-JP': 'japanese',
	'ru-RU': 'russian',
	'es-ES': 'spanish',
};

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
				value: t(`settings.general.${LANGUAGE_LABEL_KEYS[locale]}`),
				disabled: isPending,
			}}
			sheet={{ title: t('settings.general.language') }}
		>
			{(close) => (
				<View style={styles.list}>
					{locales.map((language, index) => (
						<ItemRadio
							key={language}
							isFirstInGroup={index === 0}
							label={t(`settings.general.${LANGUAGE_LABEL_KEYS[language]}`)}
							selected={locale === language}
							onPress={() => handleSelectLanguage(language, close)}
						/>
					))}
				</View>
			)}
		</ItemPicker>
	);
};

const styles = StyleSheet.create({
	list: { marginHorizontal: -14 },
});

export default LanguagePicker;

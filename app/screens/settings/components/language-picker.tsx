import { StyleSheet, View } from 'react-native';

import { type Locale, locales } from '@/types/locale';

import { invalidate } from '@/hooks/apis/invalidate';
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
};

/** 앱 언어 선택 컴포넌트 */
const LanguagePicker = () => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);
	const setLocale = useDeviceSettingsStore((state) => state.setLocale);

	const handleChangeLanguage = (nextLocale: Locale) => {
		if (locale === nextLocale) {
			return;
		}

		try {
			setLocale(nextLocale);

			void invalidate(apiKeys.all());

			setUserProperties({ locale: nextLocale });
			track('language_changed', { from: locale, to: nextLocale });
		} catch (e) {
			reportError(e, 'change_language');
		}
	};

	return (
		<ItemPicker
			item={{
				icon: MessageSquareTextIcon,
				label: t('settings.general.language'),
				value: t(`settings.general.${LANGUAGE_LABEL_KEYS[locale]}`),
			}}
			sheet={{ title: t('settings.general.language') }}
		>
			{(close) => (
				<View style={styles.list}>
					{locales.map((language, index) => {
						const handleSelectLanguage = () => {
							handleChangeLanguage(language);

							close();
						};

						return (
							<ItemRadio
								key={language}
								first={index === 0}
								label={t(`settings.general.${LANGUAGE_LABEL_KEYS[language]}`)}
								selected={locale === language}
								onPress={handleSelectLanguage}
							/>
						);
					})}
				</View>
			)}
		</ItemPicker>
	);
};

const styles = StyleSheet.create({
	list: { marginHorizontal: -14 },
});

export default LanguagePicker;

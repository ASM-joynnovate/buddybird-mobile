import { useGetMe, useUpdateMe } from '@/hooks/apis/users';

import { useTranslation } from 'react-i18next';

import { countryEnglishNames, countryNames, countryNativeNames } from '@/i18n/countries';

import { apiErrorMessage } from '@/lib/api';

import { EarthIcon } from 'lucide-react-native';

import CountryList, { type CountryItem } from '@/screens/settings/components/country-picker/country-list';
import { reportError } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { useMessageStore } from '@/stores/message';

import { ItemPicker } from '@/components/ui/item/picker';

/** 내 국가 선택 컴포넌트 */
const CountryPicker = () => {
	const { t } = useTranslation();

	const { data: meData } = useGetMe();

	const { isPending, mutate: updateMe } = useUpdateMe();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const openPopup = useMessageStore((state) => state.openPopup);

	const names = countryNames(locale);
	const items: CountryItem[] = Object.entries(names)
		.map(([code, name]) => ({
			code,
			name,
			searchNames: [name, countryNativeNames[code], ...countryEnglishNames[code]],
		}))
		.sort((a, b) => a.name.localeCompare(b.name, locale));
	const country = meData.country ?? null;

	const handleChangeCountry = (nextCountry: string) => {
		if (isPending || country === nextCountry) {
			return;
		}

		updateMe(
			{ data: { country: nextCountry } },
			{
				onError: (error) => {
					reportError(error, 'user_country_update');

					openPopup({ title: apiErrorMessage(error, t) });
				},
			},
		);
	};

	return (
		<ItemPicker
			item={{
				icon: EarthIcon,
				label: t('settings.general.country'),
				value: country ? (names[country] ?? country) : t('settings.general.countryChoose'),
				disabled: isPending,
			}}
			sheet={{ title: t('settings.general.country'), listLayout: true }}
		>
			{(close) => {
				const handleSelectCountry = (nextCountry: string) => {
					handleChangeCountry(nextCountry);

					close();
				};

				return <CountryList items={items} country={country} onSelect={handleSelectCountry} />;
			}}
		</ItemPicker>
	);
};

export default CountryPicker;

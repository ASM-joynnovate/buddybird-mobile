import type { CountryItem } from '@/types/country';

import { useGetMe, useUpdateMe } from '@/hooks/apis/users';

import { useTranslation } from 'react-i18next';

import { countryEnglishNames, countryNamesIn, countryNativeNames } from '@/i18n/countries';

import { apiErrorMessage } from '@/lib/api';

import { EarthIcon } from 'lucide-react-native';
import { toast } from 'sonner-native';

import CountryPickerList from '@/screens/settings/components/country-picker/list';
import { reportError } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';

import { ItemPicker } from '@/components/ui/item/picker';
import { Toast } from '@/components/ui/toast';

/** 내 국가 선택 컴포넌트 */
const CountryPicker = () => {
	const { t } = useTranslation();

	const { data: meData } = useGetMe();

	const { isPending, mutate: updateMe } = useUpdateMe();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const countryNameByCode = countryNamesIn(locale);
	const countryItems: CountryItem[] = Object.entries(countryNameByCode)
		.map(([code, name]) => ({
			code,
			name,
			searchNames: [name, countryNativeNames[code], ...countryEnglishNames[code]],
		}))
		.sort((a, b) => a.name.localeCompare(b.name, locale));
	const country = meData.country ?? null;

	const handleSelectCountry = (nextCountry: string, close: () => void) => {
		if (isPending || country === nextCountry) {
			close();
			return;
		}

		updateMe(
			{ data: { country: nextCountry } },
			{
				onError: (error) => {
					reportError(error, 'user_country_update');

					toast.custom(<Toast variant="error" message={apiErrorMessage(error, t)} />);
				},
			},
		);

		close();
	};

	return (
		<ItemPicker
			itemProps={{
				icon: EarthIcon,
				label: t('settings.general.country'),
				value: country ? (countryNameByCode[country] ?? country) : t('settings.general.countryChoose'),
				disabled: isPending,
			}}
			sheet={{ title: t('settings.general.country'), listLayout: true }}
		>
			{(close) => (
				<CountryPickerList
					countryItems={countryItems}
					country={country}
					onSelect={(nextCountry) => handleSelectCountry(nextCountry, close)}
				/>
			)}
		</ItemPicker>
	);
};

export default CountryPicker;

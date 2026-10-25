import type { RootStackParamList } from '@/types/navigation';
import type { SleepSettings } from '@/types/sleep-settings';

import { useGetSettings, useUpdateSleepSettings } from '@/hooks/apis/settings';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BellIcon, SmartphoneIcon } from 'lucide-react-native';
import { toast } from 'sonner-native';

import CountryPicker from '@/screens/settings/components/country-picker';
import LanguagePicker from '@/screens/settings/components/language-picker';
import { useAuthStore } from '@/stores/auth';

import SleepTimePicker from '@/components/session/sleep-time-picker';
import { Item } from '@/components/ui/item';
import { ItemGroup } from '@/components/ui/item/group';
import { Toast } from '@/components/ui/toast';

/** 일반 설정 컴포넌트 */
const GeneralGroup = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const { data: settingsData } = useGetSettings();

	const { isPending, mutate } = useUpdateSleepSettings();

	const isAnonymous = useAuthStore((state) => state.isAnonymous);

	const handleSaveSleepSettings = (sleep: SleepSettings) => {
		if (isPending) {
			return;
		}

		mutate(
			{ data: sleep },
			{
				onError: () => {
					toast.custom(<Toast variant="error" message={t('settings.saveError')} />);
				},
			},
		);
	};

	return (
		<ItemGroup>
			<SleepTimePicker
				value={settingsData.sleep}
				isFirstInGroup
				disabled={isPending}
				onChange={handleSaveSleepSettings}
			/>
			<Item
				icon={BellIcon}
				label={t('settings.notifications.title')}
				onPress={() => navigation.navigate('NotificationSettings')}
			/>
			<LanguagePicker />
			<CountryPicker />
			<Item
				icon={SmartphoneIcon}
				label={t('settings.general.devices')}
				onPress={() => navigation.navigate(isAnonymous ? 'Login' : 'Devices')}
			/>
		</ItemGroup>
	);
};

export default GeneralGroup;

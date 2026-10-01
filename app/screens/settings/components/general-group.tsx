import type { RootStackParamList } from '@/types/navigation';

import { useGetSettings, useUpdateSleepSettings } from '@/hooks/apis/settings';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BellIcon, SmartphoneIcon } from 'lucide-react-native';

import LanguagePicker from '@/screens/settings/components/language-picker';
import { useAccountStore } from '@/stores/account';

import SleepTimePicker from '@/components/session/sleep-time-picker';
import { InlineError } from '@/components/ui/inline-error';
import { Item } from '@/components/ui/item';
import { ItemGroup } from '@/components/ui/item/group';

/** 수면 시간, 알림, 앱 언어, 연결된 기기 설정 컴포넌트 */
const GeneralGroup = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const { data: settingsData } = useGetSettings();

	const updateSleepSettings = useUpdateSleepSettings();

	const isAnonymous = useAccountStore((state) => state.isAnonymous);

	return (
		<>
			<ItemGroup>
				<SleepTimePicker
					value={settingsData.sleep}
					first
					onChange={(sleep) => updateSleepSettings.mutate({ data: sleep })}
				/>
				<Item
					icon={BellIcon}
					label={t('settings.notifications.title')}
					onPress={() => navigation.navigate('NotificationSettings')}
				/>
				<LanguagePicker />
				<Item
					icon={SmartphoneIcon}
					label={t('settings.general.devices')}
					onPress={() => navigation.navigate(isAnonymous ? 'Login' : 'Devices')}
				/>
			</ItemGroup>

			<InlineError message={updateSleepSettings.isError ? t('settings.saveError') : null} />
		</>
	);
};

export default GeneralGroup;

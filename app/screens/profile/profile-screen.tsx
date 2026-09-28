import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsIcon } from 'lucide-react-native';

import ProfileCards from '@/screens/profile/components/profile-cards';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';

export function ProfileScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	return (
		<Screen>
			{/*헤더*/}
			<ScreenHeader
				large
				title={t('profile.title')}
				right=<IconButton
					icon={SettingsIcon}
					label={t('profile.settings')}
					onPress={() => navigation.navigate('Settings')}
				/>
			/>

			{/*계정과 앵무새*/}
			<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<Skeleton rows={3} height={96} />>
				<ProfileCards />
			</ErrorHandlingWrapper>
		</Screen>
	);
}

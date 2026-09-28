import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AccountSection } from '@/screens/settings/components/account-section';
import { GeneralGroup } from '@/screens/settings/components/general-group';
import SleepAndNotificationGroups from '@/screens/settings/components/sleep-and-notification-groups';
import { SupportGroup } from '@/screens/settings/components/support-group';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';

export function SettingsScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	return (
		<Screen>
			{/*헤더*/}
			<ScreenHeader title={t('settings.title')} onBack={() => navigation.goBack()} />

			{/*설정 그룹*/}
			<View style={styles.sections}>
				<ErrorHandlingWrapper
					fallbackComponent={ScreenError}
					suspenseFallback=<Skeleton rows={3} height={56} />
				>
					<SleepAndNotificationGroups />
				</ErrorHandlingWrapper>

				<GeneralGroup />

				<AccountSection />

				<SupportGroup />
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	sections: { gap: 28 },
});

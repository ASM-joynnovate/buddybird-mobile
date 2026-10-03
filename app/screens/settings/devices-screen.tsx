import { StyleSheet, View } from 'react-native';

import { usePrefetchQuery } from '@tanstack/react-query';

import type { RootStackParamList } from '@/types/navigation';

import { getDeviceListOptions } from '@/hooks/apis/devices';
import { getRunningSessionOptions } from '@/hooks/apis/sessions';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import DeviceList from '@/screens/settings/components/device-list';
import DeviceListSkeleton from '@/screens/settings/components/device-list-skeleton';
import { contentMaxWidth } from '@/theme';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
/** 연결된 기기 화면 */
const DevicesScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	usePrefetchQuery(getDeviceListOptions());
	usePrefetchQuery(getRunningSessionOptions());

	return (
		<Screen scrollable={false}>
			<View style={styles.container}>
				<ScreenHeader title={t('settings.devices.title')} onBack={() => navigation.goBack()} />

				<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<DeviceListSkeleton />>
					<DeviceList />
				</ErrorHandlingWrapper>
			</View>
		</Screen>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
		paddingHorizontal: 24,
		paddingTop: 20,
	},
});

export default DevicesScreen;

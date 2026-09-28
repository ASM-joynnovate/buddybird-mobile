import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ConsentList from '@/screens/settings/components/consent-list';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';

/** 약관 동의 제목과 뒤로 가기 버튼, 약관별 동의 여부를 보여 주는 화면 */
const ConsentSettingsScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	return (
		<Screen>
			{/*약관 동의 제목과 뒤로 가기 버튼*/}
			<ScreenHeader title={t('settings.consents.title')} onBack={() => navigation.goBack()} />

			{/*약관별 동의 여부와 저장 실패 안내*/}
			<ErrorHandlingWrapper
				fallbackComponent={ScreenError}
				suspenseFallback=<Skeleton blockCount={4} height={56} />
			>
				<ConsentList />
			</ErrorHandlingWrapper>
		</Screen>
	);
};

export default ConsentSettingsScreen;

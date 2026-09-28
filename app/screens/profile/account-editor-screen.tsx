import type { ProfileStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AccountForm from '@/screens/profile/components/account-form';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';

/** 사진, 닉네임 입력, 저장 버튼을 보여 주고 저장을 마치면 이전 화면으로 돌아가는 화면 */
const AccountEditorScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

	return (
		<Screen>
			{/*계정 수정 제목과 뒤로 가기 버튼*/}
			<ScreenHeader title={t('profile.editAccount')} onBack={() => navigation.goBack()} />

			{/*사진, 닉네임 입력, 저장 버튼*/}
			<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<Skeleton blockCount={2} />>
				<AccountForm onSaved={() => navigation.goBack()} />
			</ErrorHandlingWrapper>
		</Screen>
	);
};

export default AccountEditorScreen;

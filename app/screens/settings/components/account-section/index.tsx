import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import SignOutDialog from '@/screens/settings/components/account-section/sign-out-dialog';
import WithdrawDialog from '@/screens/settings/components/account-section/withdraw-dialog';
import { useAccountStore } from '@/stores/account';

import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';
import { TextButton } from '@/components/ui/text-button';

/** 로그인 버튼이나 로그아웃과 회원 탈퇴 버튼을 보여 주고 누르면 로그인 화면이나 확인 다이얼로그를 여는 컴포넌트 */
const AccountSection = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const [openedDialog, setOpenedDialog] = useState<'signOut' | 'withdraw' | null>(null);

	const isAnonymous = useAccountStore((state) => state.isAnonymous);

	return (
		<View>
			{/*제목과 계정 버튼*/}
			<Copy accessibilityRole="header" style={ui.sectionTitle}>
				{t('settings.account.title')}
			</Copy>
			<View style={styles.buttons}>
				{isAnonymous ? (
					<TextButton label={t('auth.signIn')} onPress={() => navigation.navigate('Login')} />
				) : (
					<>
						<TextButton
							label={t('settings.account.signOut')}
							variant="muted"
							onPress={() => setOpenedDialog('signOut')}
						/>
						<TextButton
							label={t('settings.account.withdraw')}
							variant="muted"
							onPress={() => setOpenedDialog('withdraw')}
						/>
					</>
				)}
			</View>

			{/*로그아웃과 탈퇴 다이얼로그*/}
			<SignOutDialog visible={openedDialog === 'signOut'} onClose={() => setOpenedDialog(null)} />
			<WithdrawDialog visible={openedDialog === 'withdraw'} onClose={() => setOpenedDialog(null)} />
		</View>
	);
};

const styles = StyleSheet.create({
	buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
});

export default AccountSection;

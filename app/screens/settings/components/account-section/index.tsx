import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import SignOutDialog from '@/screens/settings/components/account-section/sign-out-dialog';
import WithdrawDialog from '@/screens/settings/components/account-section/withdraw-dialog';
import { useAccountStore } from '@/stores/account';

import { TextButton } from '@/components/ui/text-button';

/** 로그아웃과 회원 탈퇴 버튼 컴포넌트 */
const AccountSection = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const [openedDialog, setOpenedDialog] = useState<'signOut' | 'withdraw' | null>(null);

	const isAnonymous = useAccountStore((state) => state.isAnonymous);

	return (
		<>
			<View style={styles.buttonsRow}>
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

			<SignOutDialog visible={openedDialog === 'signOut'} onClose={() => setOpenedDialog(null)} />
			<WithdrawDialog visible={openedDialog === 'withdraw'} onClose={() => setOpenedDialog(null)} />
		</>
	);
};

const styles = StyleSheet.create({
	buttonsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginRight: -8 },
});

export default AccountSection;

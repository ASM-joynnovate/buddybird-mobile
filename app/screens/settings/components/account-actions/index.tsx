import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { SignOutDialog } from '@/screens/settings/components/account-actions/sign-out-dialog';
import { WithdrawDialog } from '@/screens/settings/components/account-actions/withdraw-dialog';
import { useAccountStore } from '@/stores/account';

import { ui } from '@/components/ui/styles';
import { Copy } from '@/components/ui/text';
import { TextButton } from '@/components/ui/text-button';

interface Props {
	onSignIn(): void;
}

export function AccountActions({ onSignIn }: Props) {
	const { t } = useTranslation();

	const isAnonymous = useAccountStore((account) => account.isAnonymous);

	const [openDialog, setOpenDialog] = useState<'signOut' | 'withdraw' | null>(null);

	return (
		<View>
			<Copy accessibilityRole="header" style={ui.sectionTitle}>
				{t('settings.account.title')}
			</Copy>
			<View style={styles.buttons}>
				{isAnonymous ? (
					<TextButton label={t('auth.signIn')} onPress={onSignIn} />
				) : (
					<>
						<TextButton
							label={t('settings.account.signOut')}
							tone="muted"
							onPress={() => setOpenDialog('signOut')}
						/>
						<TextButton
							label={t('settings.account.withdraw')}
							tone="muted"
							onPress={() => setOpenDialog('withdraw')}
						/>
					</>
				)}
			</View>
			<SignOutDialog visible={openDialog === 'signOut'} onClose={() => setOpenDialog(null)} />
			<WithdrawDialog visible={openDialog === 'withdraw'} onClose={() => setOpenDialog(null)} />
		</View>
	);
}

const styles = StyleSheet.create({
	buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
});

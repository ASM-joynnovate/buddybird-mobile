import { StyleSheet, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import type { ProfileStackParamList, RootStackParamList } from '@/types/navigation';

import { getParrotListOptions } from '@/hooks/apis/parrots';
import { getMeOptions } from '@/hooks/apis/users';

import { useTranslation } from 'react-i18next';

import { type CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PlusIcon, SettingsIcon } from 'lucide-react-native';

import { AccountCard } from '@/screens/profile/components/account-card';
import { ParrotCard } from '@/screens/profile/components/parrot-card';
import { useAccountStore } from '@/stores/account';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';
import { ui } from '@/components/ui/styles';
import { Copy } from '@/components/ui/text';

type Navigation = CompositeNavigationProp<
	NativeStackNavigationProp<ProfileStackParamList, 'Profile'>,
	NativeStackNavigationProp<RootStackParamList>
>;

export function ProfileScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation<Navigation>();

	const { data: meData, isError: isMeError, refetch: refetchMe } = useQuery(getMeOptions());
	const {
		data: parrotListData,
		isError: isParrotListError,
		refetch: refetchParrotList,
	} = useQuery(getParrotListOptions());

	const isAnonymous = useAccountStore((account) => account.isAnonymous);

	function body() {
		if (isMeError || isParrotListError) {
			return (
				<ScreenError
					message={t('common.loadError')}
					onRetry={() => {
						void refetchMe();
						void refetchParrotList();
					}}
				/>
			);
		}

		if (!meData || !parrotListData) {
			return <Skeleton rows={3} height={96} />;
		}

		return (
			<>
				{/*계정 카드*/}
				<AccountCard user={meData} onPress={() => navigation.navigate('AccountEditor')} />

				{/*로그인 버튼*/}
				{isAnonymous ? (
					<Button
						label={t('auth.signIn')}
						variant="secondary"
						onPress={() => navigation.navigate('Login')}
						style={styles.signIn}
					/>
				) : null}

				{/*앵무새 목록*/}
				<View style={ui.section}>
					<Copy accessibilityRole="header" style={ui.sectionTitle}>
						{t('profile.parrots')}
					</Copy>
					<View style={styles.parrots}>
						{parrotListData.map((parrot) => (
							<ParrotCard
								key={parrot.id}
								parrot={parrot}
								onPress={() => navigation.navigate('ParrotEditor', { parrotId: parrot.id })}
							/>
						))}
					</View>

					<Button
						label={t('profile.addParrot')}
						icon={PlusIcon}
						variant="secondary"
						onPress={() => navigation.navigate('ParrotEditor')}
						style={styles.add}
					/>
				</View>
			</>
		);
	}

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
			{body()}
		</Screen>
	);
}

const styles = StyleSheet.create({
	parrots: { gap: 12 },
	add: { marginTop: 16 },
	signIn: { marginTop: 12 },
});

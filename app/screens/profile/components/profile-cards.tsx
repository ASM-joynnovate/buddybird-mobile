import { StyleSheet, View } from 'react-native';

import type { ProfileStackParamList, RootStackParamList } from '@/types/navigation';

import { useGetParrotList } from '@/hooks/apis/parrots';
import { useGetMe } from '@/hooks/apis/users';

import { useTranslation } from 'react-i18next';

import { type CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PlusIcon } from 'lucide-react-native';

import { AccountCard } from '@/screens/profile/components/account-card';
import { ParrotCard } from '@/screens/profile/components/parrot-card';
import { useAccountStore } from '@/stores/account';

import { Button } from '@/components/ui/button';
import { ui } from '@/components/ui/styles';
import { Copy } from '@/components/ui/text';

type Navigation = CompositeNavigationProp<
	NativeStackNavigationProp<ProfileStackParamList, 'Profile'>,
	NativeStackNavigationProp<RootStackParamList>
>;

/** 계정과 앵무새 카드 컴포넌트 */
const ProfileCards = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<Navigation>();

	const { data: meData } = useGetMe();
	const { data: parrotListData } = useGetParrotList();

	const isAnonymous = useAccountStore((state) => state.isAnonymous);

	return (
		<>
			{/*계정 카드*/}
			<AccountCard user={meData} onPress={() => navigation.navigate('AccountEditor')} />

			{/*로그인 버튼*/}
			{isAnonymous && (
				<Button
					label={t('auth.signIn')}
					variant="secondary"
					onPress={() => navigation.navigate('Login')}
					style={styles.signIn}
				/>
			)}

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
					style={styles.addParrotButton}
				/>
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	parrots: { gap: 12 },
	addParrotButton: { marginTop: 16 },
	signIn: { marginTop: 12 },
});

export default ProfileCards;

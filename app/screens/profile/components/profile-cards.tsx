import { useEffect, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { MainTabParamList, ProfileStackParamList, RootStackParamList } from '@/types/navigation';

import { useGetParrotList } from '@/hooks/apis/parrots';

import { useTranslation } from 'react-i18next';

import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { type CompositeNavigationProp, useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { UPLOAD_POLL_INTERVAL_MS } from '@/config/policy';
import AddParrotCard from '@/screens/profile/components/add-parrot-card';
import ParrotCard from '@/screens/profile/components/parrot-card';
import ProfileCard from '@/screens/profile/components/profile-card';
import { useAuthStore } from '@/stores/auth';

import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';

const CARDS_PER_ROW = 2;
export const CARD_TILTS = [-1.6, 1.2, 1.4, -1.1, 1.3];

type Navigation = CompositeNavigationProp<
	NativeStackNavigationProp<ProfileStackParamList, 'Profile'>,
	NativeStackNavigationProp<RootStackParamList>
>;

/** 프로필 카드 목록 컴포넌트 */
const ProfileCards = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<Navigation>();
	const screenFocused = useIsFocused();

	const [dropCount, setDropCount] = useState(0);

	const { data: parrotListData } = useGetParrotList({
		refetchInterval: (query) =>
			screenFocused && query.state.data?.some((parrot) => parrot.uploading_photo_file?.status === 'pending')
				? UPLOAD_POLL_INTERVAL_MS
				: false,
	});

	const isAnonymous = useAuthStore((state) => state.isAnonymous);

	/** 카드 순서별 기울기 반환 함수 */
	const tiltAt = (index: number) => CARD_TILTS[index % CARD_TILTS.length];
	const cards = [
		...parrotListData.map((parrot, index) => (
			<ParrotCard key={parrot.id} parrot={parrot} tilt={tiltAt(index)} order={index} />
		)),
		<AddParrotCard key="add" tilt={tiltAt(parrotListData.length)} order={parrotListData.length} />,
	];
	const cardRows = Array.from({ length: Math.ceil(cards.length / CARDS_PER_ROW) }, (_, row) =>
		cards.slice(row * CARDS_PER_ROW, (row + 1) * CARDS_PER_ROW),
	);

	/** 프로필 탭 진입 시 카드 애니메이션 재생 */
	useEffect(() => {
		const tabNavigation = navigation.getParent<BottomTabNavigationProp<MainTabParamList>>();

		return tabNavigation?.addListener('tabPress', () => {
			if (!tabNavigation.isFocused()) {
				setDropCount((prev) => prev + 1);
			}
		});
	}, [navigation]);

	return (
		<>
			<ProfileCard />

			{isAnonymous && (
				<Button
					label={t('auth.signIn')}
					variant="secondary"
					onPress={() => navigation.navigate('Login')}
					style={styles.signIn}
				/>
			)}

			<View style={ui.sectionContainer}>
				<Copy accessibilityRole="header" style={ui.sectionTitle}>
					{t('profile.parrots')}
				</Copy>
				<View key={dropCount} style={styles.parrotsContainer}>
					{cardRows.map((row, index) => (
						<View key={index} style={ui.actionsRow}>
							{row}
							{row.length < CARDS_PER_ROW && <View style={ui.equalColumn} />}
						</View>
					))}
				</View>
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	parrotsContainer: { gap: 16, paddingTop: 4 },
	signIn: { marginTop: 12 },
});

export default ProfileCards;

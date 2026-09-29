import { Image, StyleSheet, View } from 'react-native';

import type { HomeStackParamList, RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { type CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BellIcon, SettingsIcon } from 'lucide-react-native';

import { mascotImage } from '@/theme';

import { IconButton } from '@/components/ui/icon-button';
import { Title } from '@/components/ui/title';

type Navigation = CompositeNavigationProp<
	NativeStackNavigationProp<HomeStackParamList, 'Home'>,
	NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
	unreadCount: number;
}

/**
 * 로고와 설정, 알림 버튼 컴포넌트
 * @param unreadCount 읽지 않은 알림 개수
 */
const HomeTopBar = ({ unreadCount }: Props) => {
	const { t } = useTranslation();

	const navigation = useNavigation<Navigation>();

	return (
		<View style={styles.container}>
			{/*로고*/}
			<Image source={mascotImage} accessible={false} accessibilityIgnoresInvertColors style={styles.mascot} />
			<Title style={styles.brand}>{t('home.brand')}</Title>

			{/*설정, 알림 버튼*/}
			<IconButton
				icon={SettingsIcon}
				label={t('home.settings')}
				onPress={() => navigation.navigate('Settings')}
			/>
			<IconButton
				icon={BellIcon}
				label={
					unreadCount > 0 ? t('home.notificationsUnread', { count: unreadCount }) : t('home.notifications')
				}
				onPress={() => navigation.navigate('Notifications')}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6 },
	mascot: { width: 34, height: 34 },
	brand: { flex: 1, minWidth: 0, fontSize: 20, lineHeight: 26 },
});

export default HomeTopBar;

import { Image, StyleSheet, View } from 'react-native';

import type { HomeStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BellIcon } from 'lucide-react-native';

import { mascotImage } from '@/theme';

import { IconButton } from '@/components/ui/icon-button';
import { Title } from '@/components/ui/title';

interface Props {
	unreadCount: number;
}

/**
 * 홈 헤더 컴포넌트
 * @param unreadCount 읽지 않은 알림 개수
 */
const HomeTopBar = ({ unreadCount }: Props) => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

	return (
		<View style={styles.container}>
			{/*로고*/}
			<Image source={mascotImage} accessible={false} accessibilityIgnoresInvertColors style={styles.mascot} />
			<Title style={styles.brand}>{t('home.brand')}</Title>

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

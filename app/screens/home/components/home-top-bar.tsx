import { StyleSheet, View } from 'react-native';

import type { HomeStackParamList } from '@/types/navigation';

import { useGetHomeSummary } from '@/hooks/apis/home';
import useStartupLanding from '@/hooks/use-startup-landing';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BellIcon } from 'lucide-react-native';
import Animated from 'react-native-reanimated';

import MascotArtwork from '@/components/mascot/artwork';
import { DotBadge } from '@/components/ui/dot-badge';
import { IconButton } from '@/components/ui/icon-button';
import { Title } from '@/components/ui/title';

/** 알림 버튼이 있는 홈 상단 바 컴포넌트 */
const HomeTopBar = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

	const { data: homeSummaryData } = useGetHomeSummary();

	const { buddyRef, buddyStyle } = useStartupLanding();

	const unreadCount = homeSummaryData.unread_notification_count;

	return (
		<View style={styles.container}>
			{/*로고*/}
			<Animated.View ref={buddyRef} style={[styles.mascot, buddyStyle]}>
				<MascotArtwork />
			</Animated.View>
			<Title style={styles.brand}>{t('home.brand')}</Title>

			<View>
				<IconButton
					icon={BellIcon}
					label={
						unreadCount > 0
							? t('home.notificationsUnread', { count: unreadCount })
							: t('home.notifications')
					}
					onPress={() => navigation.navigate('Notifications')}
				/>
				{unreadCount > 0 && (
					<View pointerEvents="none" style={styles.unreadDot}>
						<DotBadge size="small" />
					</View>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6 },
	mascot: { width: 34, height: 34 },
	brand: { flex: 1, minWidth: 0, fontSize: 20, lineHeight: 26 },
	unreadDot: { position: 'absolute', top: 11, right: 11 },
});

export default HomeTopBar;

import { StyleSheet, View } from 'react-native';

import { useInfiniteQuery } from '@tanstack/react-query';

import type { RootStackParamList } from '@/types/navigation';

import { getNoticeListOptions } from '@/hooks/apis/notices';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BookOpenIcon, MegaphoneIcon, SendIcon } from 'lucide-react-native';

import { installedVersion } from '@/services/device/application';
import { useFeedbackStore } from '@/stores/feedback';
import { colors } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { Item } from '@/components/ui/item';
import { ItemGroup } from '@/components/ui/item/group';

/** 지원 설정 컴포넌트 */
const SupportGroup = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const { data: noticeListData } = useInfiniteQuery({ ...getNoticeListOptions(), throwOnError: false });

	const openFeedback = useFeedbackStore((state) => state.openFeedback);

	const hasUnreadNotice = Boolean(
		noticeListData?.pages.some((noticePage) => noticePage.data.some((notice) => !notice.is_read)),
	);

	return (
		<View>
			<ItemGroup title={t('settings.support.title')}>
				<Item
					first
					icon={SendIcon}
					label={t('settings.support.feedback')}
					onPress={() => openFeedback('profile')}
				/>
				<Item
					icon={MegaphoneIcon}
					label={t('settings.support.notices')}
					value={hasUnreadNotice ? t('settings.support.unreadNotice') : undefined}
					showDot={hasUnreadNotice}
					onPress={() => navigation.navigate('NoticeList')}
				/>
				<Item
					icon={BookOpenIcon}
					label={t('settings.support.consents')}
					onPress={() => navigation.navigate('ConsentSettings')}
				/>
			</ItemGroup>

			<Copy style={styles.version}>{t('settings.support.version', { version: installedVersion })}</Copy>
		</View>
	);
};

const styles = StyleSheet.create({
	version: { marginTop: 12, fontSize: 13, color: colors.muted, textAlign: 'right' },
});

export default SupportGroup;

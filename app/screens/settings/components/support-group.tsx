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

/** 피드백 보내기, 공지, 약관 동의 항목과 앱 버전을 보여 주고 누르면 피드백 다이얼로그나 해당 화면을 여는 컴포넌트 */
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
			{/*피드백 보내기, 공지, 약관 동의 항목*/}
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

			{/*앱 버전*/}
			<Copy style={styles.version}>{t('settings.support.version', { version: installedVersion })}</Copy>
		</View>
	);
};

const styles = StyleSheet.create({
	version: { marginTop: 12, fontSize: 13, color: colors.muted, textAlign: 'right' },
});

export default SupportGroup;

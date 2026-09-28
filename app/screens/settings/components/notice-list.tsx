import { FlatList, StyleSheet, View } from 'react-native';

import type { Notice } from '@/types/apis/notices';

import type { RootStackParamList } from '@/types/navigation';

import { useGetNoticeList } from '@/hooks/apis/notices';

import { useTranslation } from 'react-i18next';

import { formatDate } from '@/i18n/format';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';
import { joinLabel } from '@/utils/a11y';

import { Copy } from '@/components/ui/copy';
import { DotBadge } from '@/components/ui/dot-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

/** 공지 목록 컴포넌트 */
const NoticeList = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const { data: noticeListData, fetchNextPage, hasNextPage } = useGetNoticeList();

	const locale = useDeviceSettingsStore((state) => state.locale);

	/** 공지 항목 */
	const renderItem = ({ item: notice }: { item: Notice }) => {
		const dateText = formatDate(notice.starts_at, locale);

		return (
			<PressableSurface
				accessibilityLabel={joinLabel(notice.title, dateText, !notice.is_read && t('settings.notices.unread'))}
				depth="low"
				onPress={() => navigation.navigate('NoticeDetail', { noticeId: notice.id })}
				contentStyle={styles.card}
			>
				<View style={styles.textContainer}>
					<Copy style={styles.title} numberOfLines={2}>
						{notice.title}
					</Copy>
					<Copy style={styles.date}>{dateText}</Copy>
				</View>

				{!notice.is_read && <DotBadge />}
			</PressableSurface>
		);
	};

	/** 다음 쪽 공지 불러오기 */
	const handleFetchNextPage = () => {
		if (hasNextPage) {
			void fetchNextPage();
		}
	};

	return (
		<FlatList
			data={noticeListData.pages.flatMap((noticePage) => noticePage.data)}
			keyExtractor={(notice) => notice.id}
			renderItem={renderItem}
			onEndReached={handleFetchNextPage}
			contentContainerStyle={styles.list}
			ListEmptyComponent=<EmptyState message={t('settings.notices.empty')} />
		/>
	);
};

const styles = StyleSheet.create({
	list: { gap: 12, paddingBottom: 32 },
	card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
	textContainer: { flex: 1, minWidth: 0, gap: 4 },
	title: { fontFamily: font.extraBold, fontSize: 16 },
	date: { fontSize: 13, color: colors.muted },
});

export default NoticeList;

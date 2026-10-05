import { FlatList, StyleSheet, View } from 'react-native';

import type { Announcement } from '@/types/apis/announcements';

import type { RootStackParamList } from '@/types/navigation';

import { useGetAnnouncementList } from '@/hooks/apis/announcements';

import { useTranslation } from 'react-i18next';

import { formatMonthDay } from '@/i18n/format';

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
const AnnouncementList = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const { data: announcementListData, fetchNextPage, hasNextPage } = useGetAnnouncementList();

	const locale = useDeviceSettingsStore((state) => state.locale);

	/** 공지 항목 렌더링 함수 */
	const renderItem = ({ item: announcement }: { item: Announcement }) => {
		const dateText = formatMonthDay(announcement.starts_at, locale);

		return (
			<PressableSurface
				accessibilityLabel={joinLabel(
					announcement.title,
					dateText,
					!announcement.is_read && t('home.announcementList.unread'),
				)}
				depth="low"
				onPress={() => navigation.navigate('AnnouncementDetail', { announcementId: announcement.id })}
				contentStyle={styles.card}
			>
				<View style={styles.textContainer}>
					<Copy style={styles.title} numberOfLines={2}>
						{announcement.title}
					</Copy>
					<Copy style={styles.date}>{dateText}</Copy>
				</View>

				{!announcement.is_read && <DotBadge />}
			</PressableSurface>
		);
	};

	const handleFetchNextPage = () => {
		if (hasNextPage) {
			void fetchNextPage();
		}
	};

	return (
		<FlatList
			data={announcementListData.pages.flatMap((announcementPage) => announcementPage.data)}
			keyExtractor={(announcement) => announcement.id}
			renderItem={renderItem}
			onEndReached={handleFetchNextPage}
			contentContainerStyle={styles.list}
			ListEmptyComponent=<EmptyState message={t('home.announcementList.empty')} />
		/>
	);
};

const styles = StyleSheet.create({
	list: { flexGrow: 1, gap: 12, paddingBottom: 32 },
	card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
	textContainer: { flex: 1, minWidth: 0, gap: 4 },
	title: { fontFamily: font.extraBold, fontSize: 16 },
	date: { fontSize: 13, color: colors.muted },
});

export default AnnouncementList;

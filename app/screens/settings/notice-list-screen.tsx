import { FlatList, StyleSheet, View } from 'react-native';

import { useInfiniteQuery } from '@tanstack/react-query';

import type { Notice } from '@/types/apis/notices';

import type { RootStackParamList } from '@/types/navigation';

import { getNoticeListOptions } from '@/hooks/apis/notices';

import { useTranslation } from 'react-i18next';

import { formatDate } from '@/i18n/format';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, contentMaxWidth, font } from '@/theme';
import { joinLabel } from '@/utils/a11y';

import { DotBadge } from '@/components/ui/dot-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';
import { PressableSurface } from '@/components/ui/surface';
import { Copy } from '@/components/ui/text';

export function NoticeListScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const {
		data: noticeListData,
		fetchNextPage,
		hasNextPage,
		isError,
		refetch,
	} = useInfiniteQuery(getNoticeListOptions());

	const locale = useDeviceSettingsStore((state) => state.locale);

	function renderItem({ item }: { item: Notice }) {
		const date = formatDate(item.starts_at, locale);

		return (
			<PressableSurface
				accessibilityLabel={joinLabel(item.title, date, !item.is_read && t('settings.notices.unread'))}
				depth="low"
				onPress={() => navigation.navigate('NoticeDetail', { noticeId: item.id })}
				contentStyle={styles.card}
			>
				<View style={styles.lines}>
					<Copy style={styles.title} numberOfLines={2}>
						{item.title}
					</Copy>
					<Copy style={styles.date}>{date}</Copy>
				</View>

				{item.is_read ? null : <DotBadge />}
			</PressableSurface>
		);
	}

	function body() {
		if (isError) {
			return <ScreenError message={t('common.loadError')} onRetry={() => void refetch()} />;
		}

		if (!noticeListData) {
			return <Skeleton rows={3} />;
		}

		return (
			<FlatList
				data={noticeListData.pages.flatMap((page) => page.data)}
				keyExtractor={(item) => item.id}
				renderItem={renderItem}
				onEndReached={() => {
					if (hasNextPage) {
						void fetchNextPage();
					}
				}}
				contentContainerStyle={styles.list}
				ListEmptyComponent=<EmptyState message={t('settings.notices.empty')} />
			/>
		);
	}

	return (
		<Screen scroll={false}>
			<View style={styles.frame}>
				{/*헤더*/}
				<ScreenHeader title={t('settings.notices.title')} onBack={() => navigation.goBack()} />

				{/*공지 목록*/}
				{body()}
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	frame: {
		flex: 1,
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
		paddingHorizontal: 24,
		paddingTop: 20,
	},
	list: { gap: 12, paddingBottom: 32 },
	card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
	lines: { flex: 1, minWidth: 0, gap: 4 },
	title: { fontFamily: font.extraBold, fontSize: 16 },
	date: { fontSize: 13, color: colors.muted },
});

import { useEffect } from 'react';

import { Image, StyleSheet, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import type { RootStackParamList } from '@/types/navigation';

import { noticeQueryOptions, readNoticeMutationOptions } from '@/hooks/apis/notices';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { useTranslation } from 'react-i18next';

import { formatDate } from '@/i18n/format';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, radius } from '@/theme';

import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Title } from '@/components/ui/text';

export function NoticeDetailScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation();
	const { params } = useRoute<RouteProp<RootStackParamList, 'NoticeDetail'>>();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const notice = useQuery(noticeQueryOptions(params.noticeId));

	const { mutate } = useIdempotentMutation(readNoticeMutationOptions());

	const alreadyRead = notice.data?.is_read;

	useEffect(() => {
		if (alreadyRead === false) {
			mutate({ id: params.noticeId });
		}
	}, [alreadyRead, mutate, params.noticeId]);

	let body = <Skeleton rows={3} />;

	if (notice.isError) {
		body = <ScreenError message={t('common.loadError')} onRetry={() => void notice.refetch()} />;
	} else if (notice.data) {
		body = (
			<View style={styles.body}>
				<View style={styles.heading}>
					<Title>{notice.data.title}</Title>
					<Copy style={styles.date}>{formatDate(notice.data.starts_at, locale)}</Copy>
				</View>
				{notice.data.body ? <Copy style={styles.text}>{notice.data.body}</Copy> : null}
				{notice.data.images.map((image, index) => (
					<Image
						key={`${image.url}-${index}`}
						source={{ uri: image.url }}
						style={styles.image}
						resizeMode="contain"
						accessibilityIgnoresInvertColors
						accessibilityLabel={t('home.notice.image', { index: index + 1 })}
					/>
				))}
			</View>
		);
	}

	return (
		<Screen>
			<ScreenHeader onBack={() => navigation.goBack()} />
			{body}
		</Screen>
	);
}

const styles = StyleSheet.create({
	body: { gap: 20 },
	heading: { gap: 6 },
	date: { fontSize: 13, color: colors.muted },
	text: { lineHeight: 24 },
	image: {
		width: '100%',
		aspectRatio: 4 / 3,
		borderRadius: radius.card,
		backgroundColor: colors.surface,
	},
});

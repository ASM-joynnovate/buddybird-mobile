import { useEffect } from 'react';

import { Image, StyleSheet, View } from 'react-native';

import { useGetNotice, useReadNotice } from '@/hooks/apis/notices';

import { useTranslation } from 'react-i18next';

import { formatMonthDay } from '@/i18n/format';

import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { Title } from '@/components/ui/title';

interface Props {
	noticeId: string;
}

/**
 * 공지 상세 컴포넌트
 * @param noticeId 공지 ID
 */
const NoticeContent = ({ noticeId }: Props) => {
	const { t } = useTranslation();

	const { data: noticeData } = useGetNotice({ id: noticeId });

	const { mutate } = useReadNotice();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const alreadyRead = noticeData.is_read;

	/** 읽지 않은 공지를 열면 읽음 처리 */
	useEffect(() => {
		if (!alreadyRead) {
			mutate({ id: noticeId });
		}
	}, [alreadyRead, mutate, noticeId]);

	return (
		<View style={styles.noticeContainer}>
			<View style={styles.headingContainer}>
				<Title>{noticeData.title}</Title>
				<Copy style={styles.date}>{formatMonthDay(noticeData.starts_at, locale)}</Copy>
			</View>

			{!!noticeData.body && <Copy style={styles.text}>{noticeData.body}</Copy>}
			{noticeData.images.map((image, index) => (
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
};

const styles = StyleSheet.create({
	noticeContainer: { gap: 20 },
	headingContainer: { gap: 6 },
	date: { fontSize: 13, color: colors.muted },
	text: { lineHeight: 24 },
	image: {
		width: '100%',
		aspectRatio: 4 / 3,
		borderRadius: radius.card,
		backgroundColor: colors.surface,
	},
});

export default NoticeContent;

import { useEffect } from 'react';

import { Image, StyleSheet, View } from 'react-native';

import { useGetAnnouncement, useReadAnnouncement } from '@/hooks/apis/announcements';

import { useTranslation } from 'react-i18next';

import { formatMonthDay } from '@/i18n/format';

import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { Title } from '@/components/ui/title';

interface Props {
	announcementId: string;
}

/**
 * 공지 상세 컴포넌트
 * @param announcementId 공지 ID
 */
const AnnouncementContent = ({ announcementId }: Props) => {
	const { t } = useTranslation();

	const { data: announcementData } = useGetAnnouncement({ id: announcementId });

	const { mutate } = useReadAnnouncement();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const alreadyRead = announcementData.is_read;

	/** 읽지 않은 공지를 열면 읽음 처리 */
	useEffect(() => {
		if (!alreadyRead) {
			mutate({ id: announcementId });
		}
	}, [alreadyRead, mutate, announcementId]);

	return (
		<View style={styles.announcementContainer}>
			<View style={styles.headingContainer}>
				<Title>{announcementData.title}</Title>
				<Copy style={styles.date}>{formatMonthDay(announcementData.starts_at, locale)}</Copy>
			</View>

			{!!announcementData.body && <Copy style={styles.text}>{announcementData.body}</Copy>}
			{announcementData.images.map((image, index) => (
				<Image
					key={`${image.url}-${index}`}
					source={{ uri: image.url }}
					style={styles.image}
					resizeMode="contain"
					accessibilityIgnoresInvertColors
					accessibilityLabel={t('home.announcement.image', { index: index + 1 })}
				/>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	announcementContainer: { gap: 20 },
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

export default AnnouncementContent;

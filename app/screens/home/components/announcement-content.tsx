import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import { useGetAnnouncement, useReadAnnouncement } from '@/hooks/apis/announcements';

import { useTranslation } from 'react-i18next';

import { formatMonthDay } from '@/i18n/format';

import AttachedImages from '@/screens/home/components/attached-images';
import LinkedCopy from '@/screens/home/components/linked-copy';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { Title } from '@/components/ui/title';

interface Props {
	announcementId: string;
}

/**
 * 공지 내용 표시 컴포넌트
 * @param announcementId 공지 ID
 */
const AnnouncementContent = ({ announcementId }: Props) => {
	const { t } = useTranslation();

	const { data: announcementData } = useGetAnnouncement({ id: announcementId });

	const { mutate } = useReadAnnouncement();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const alreadyRead = announcementData.is_read;

	/** 읽지 않은 공지를 표시하면 읽음 처리 */
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

			<AttachedImages
				images={announcementData.images.map((image, index) => ({
					uri: image.url,
					label: t('home.announcement.image', { index: index + 1 }),
				}))}
			/>
			{!!announcementData.body && <LinkedCopy text={announcementData.body} style={styles.text} />}
		</View>
	);
};

const styles = StyleSheet.create({
	announcementContainer: { gap: 20 },
	headingContainer: { gap: 6 },
	date: { fontSize: 13, color: colors.muted },
	text: { lineHeight: 24 },
});

export default AnnouncementContent;

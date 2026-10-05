import { useEffect, useState } from 'react';

import { Image, StyleSheet, View } from 'react-native';

import type { Announcement } from '@/types/apis/announcements';

import type { RootStackParamList } from '@/types/navigation';

import { useReadAnnouncement } from '@/hooks/apis/announcements';

import { useTranslation } from 'react-i18next';

import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAnnouncementStore } from '@/stores/announcement';
import { colors, radius } from '@/theme';

import Dialog from '@/components/dialogs/dialog';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';

interface Props {
	announcements: Announcement[];
}

/**
 * 읽지 않은 공지 팝업 컴포넌트
 * @param announcements 읽지 않은 공지 목록
 */
const AnnouncementPopup = ({ announcements }: Props) => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const screenFocused = useIsFocused();

	const [queue, setQueue] = useState<readonly Announcement[]>([]);

	const { mutate } = useReadAnnouncement();

	const popupShown = useAnnouncementStore((state) => state.popupShown);
	const setPopupShown = useAnnouncementStore((state) => state.setPopupShown);

	const currentAnnouncement =
		queue.find((announcement) => announcements.some(({ id }) => id === announcement.id)) ?? null;
	const image = currentAnnouncement?.images[0];

	/** 앱 시작 후 처음 한 번 표시할 공지 목록 설정 */
	useEffect(() => {
		if (popupShown) {
			return;
		}

		setPopupShown(true);

		setQueue(announcements);
	}, [announcements, popupShown, setPopupShown]);

	const handleClose = () => {
		if (!currentAnnouncement) {
			return;
		}

		mutate({ id: currentAnnouncement.id });

		setQueue((prev) => prev.filter((announcement) => announcement.id !== currentAnnouncement.id));
	};

	const handleOpenDetail = () => {
		if (!currentAnnouncement) {
			return;
		}

		handleClose();

		navigation.navigate('AnnouncementDetail', { announcementId: currentAnnouncement.id });
	};

	return (
		<Dialog
			visible={screenFocused && currentAnnouncement !== null}
			title={currentAnnouncement?.title ?? ''}
			onClose={handleClose}
			footer={
				<View style={ui.actionsRow}>
					<Button
						label={t('common.close')}
						variant="secondary"
						size="small"
						depth="high"
						onPress={handleClose}
						style={ui.action}
					/>
					<Button
						label={t('home.announcement.viewDetail')}
						size="small"
						depth="high"
						onPress={handleOpenDetail}
						style={ui.action}
					/>
				</View>
			}
		>
			{image && (
				<Image
					source={{ uri: image.url }}
					style={styles.image}
					resizeMode="cover"
					accessibilityIgnoresInvertColors
				/>
			)}

			{!!currentAnnouncement?.body && <Copy numberOfLines={4}>{currentAnnouncement.body}</Copy>}
		</Dialog>
	);
};

const styles = StyleSheet.create({
	image: {
		width: '100%',
		aspectRatio: 16 / 9,
		borderRadius: radius.control,
		backgroundColor: colors.surface,
	},
});

export default AnnouncementPopup;

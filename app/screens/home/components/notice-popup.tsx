import { useEffect, useState } from 'react';

import { Image, StyleSheet, View } from 'react-native';

import type { Notice } from '@/types/apis/notices';

import type { RootStackParamList } from '@/types/navigation';

import { useReadNotice } from '@/hooks/apis/notices';

import { useTranslation } from 'react-i18next';

import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useNoticeStore } from '@/stores/notice';
import { colors, radius } from '@/theme';

import { Dialog } from '@/components/dialogs/dialog';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';

interface Props {
	notices: Notice[];
}

export function NoticePopup({ notices }: Props) {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const focused = useIsFocused();

	const [queue, setQueue] = useState<readonly Notice[]>([]);

	const { mutate } = useReadNotice();

	const popupShown = useNoticeStore((state) => state.popupShown);

	const setPopupShown = useNoticeStore((state) => state.setPopupShown);

	const currentNotice = queue[0] ?? null;
	const image = currentNotice?.images[0];

	/** 앱 실행마다 한 번 공지 팝업 대기열 채우기 */
	useEffect(() => {
		if (popupShown) {
			return;
		}

		setPopupShown(true);

		setQueue(notices);
	}, [notices, popupShown, setPopupShown]);

	/** 현재 공지 읽음 표시와 닫기 */
	const handleClose = () => {
		if (!currentNotice) {
			return;
		}

		mutate({ id: currentNotice.id });

		setQueue((prev) => prev.slice(1));
	};

	/** 현재 공지 닫기와 공지 상세 열기 */
	const handleOpenDetail = () => {
		if (!currentNotice) {
			return;
		}

		handleClose();

		navigation.navigate('NoticeDetail', { noticeId: currentNotice.id });
	};

	return (
		<Dialog
			visible={focused && currentNotice !== null}
			title={currentNotice?.title ?? ''}
			onClose={handleClose}
			footer={
				<View style={ui.actions}>
					<Button
						label={t('common.close')}
						variant="secondary"
						size="small"
						onPress={handleClose}
						style={ui.action}
					/>
					<Button
						label={t('home.notice.viewDetail')}
						size="small"
						onPress={handleOpenDetail}
						style={ui.action}
					/>
				</View>
			}
		>
			{image ? (
				<Image
					source={{ uri: image.url }}
					style={styles.image}
					resizeMode="cover"
					accessibilityIgnoresInvertColors
				/>
			) : null}
			{currentNotice?.body ? <Copy numberOfLines={4}>{currentNotice.body}</Copy> : null}
		</Dialog>
	);
}

const styles = StyleSheet.create({
	image: {
		width: '100%',
		aspectRatio: 16 / 9,
		borderRadius: radius.control,
		backgroundColor: colors.surface,
	},
});

import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type usePhotoPicker from '@/hooks/use-photo-picker';

import { useTranslation } from 'react-i18next';

import { ImageIcon, PencilIcon, PlusIcon } from 'lucide-react-native';

import { colors } from '@/theme';

import { Avatar } from '@/components/ui/avatar';
import { InlineError } from '@/components/ui/inline-error';
import { Item } from '@/components/ui/item';
import { ItemGroup } from '@/components/ui/item/group';
import { Sheet } from '@/components/ui/sheet';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const actionIcons = { plus: PlusIcon, edit: PencilIcon };

interface Props {
	photo: ReturnType<typeof usePhotoPicker>;
	busy: boolean;
	action?: 'plus' | 'edit';
}

/**
 * 프로필 사진을 보여 주고 누르면 사진 찍기와 앨범에서 고르기 선택지를 여는 컴포넌트
 * @param photo 고른 사진 주소, 실패 문구, 사진 찍기 함수와 고르기 함수를 담은 usePhotoPicker 결과
 * @param busy 저장 중 여부
 * @param action 사진 오른쪽 아래에 보여 줄 추가 또는 편집 아이콘
 */
const ProfilePhoto = ({ photo, busy, action = 'edit' }: Props) => {
	const { t } = useTranslation();

	const [sheetOpen, setSheetOpen] = useState(false);

	const ActionIcon = actionIcons[action];

	/** 선택지를 닫고 사진 찍기 */
	const handleTakePhoto = () => {
		setSheetOpen(false);

		void photo.take();
	};

	/** 선택지를 닫고 앨범에서 사진 고르기 */
	const handleChoosePhoto = () => {
		setSheetOpen(false);

		void photo.choose();
	};

	return (
		<View style={styles.container}>
			{/*사진, 추가 또는 편집 아이콘, 사진 선택 실패 문구*/}
			<PressableSurface
				accessibilityLabel={t('common.profilePhoto.select')}
				disabled={busy}
				onPress={() => setSheetOpen(true)}
				cornerRadius="pill"
				depth="none"
			>
				<Avatar uri={photo.photoUri} icon={ImageIcon} size="xlarge" />
				<View style={styles.photoBadge}>
					<ActionIcon size={20} color={colors.onFilled} />
				</View>
			</PressableSurface>
			<InlineError message={photo.errorMessage} />

			{/*사진 찍기와 앨범에서 고르기 선택지*/}
			<Sheet visible={sheetOpen} title={t('common.profilePhoto.title')} onClose={() => setSheetOpen(false)}>
				<ItemGroup>
					<Item first label={t('common.profilePhoto.take')} onPress={handleTakePhoto} />
					<Item label={t('common.profilePhoto.choose')} onPress={handleChoosePhoto} />
				</ItemGroup>
			</Sheet>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { alignItems: 'center', marginBottom: 20, gap: 10 },
	photoBadge: {
		position: 'absolute',
		right: -2,
		bottom: -2,
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: colors.orange,
		borderWidth: 3,
		borderColor: colors.background,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default ProfilePhoto;

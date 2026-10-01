import { useState } from 'react';

import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import type usePhotoPicker from '@/hooks/use-photo-picker';

import { useTranslation } from 'react-i18next';

import { ImageIcon, type LucideIcon, PencilIcon, PlusIcon } from 'lucide-react-native';
import Animated, { type AnimatedRef, type AnimatedStyle } from 'react-native-reanimated';

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
	photoRef?: AnimatedRef<Animated.View>;
	photoStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
	badgeStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
	placeholderIcon?: LucideIcon;
}

/**
 * 프로필 사진 선택 컴포넌트
 * @param photo usePhotoPicker 결과
 * @param busy 저장 중 여부
 * @param action 사진에 표시할 아이콘 종류
 * @param photoRef 원형 사진의 화면 위치를 잴 때 쓰는 ref
 * @param photoStyle 원형 사진에 더할 애니메이션 스타일
 * @param badgeStyle 사진 아이콘 버튼에 더할 애니메이션 스타일
 * @param placeholderIcon 사진이 없을 때 보일 아이콘
 */
const ProfilePhoto = ({
	photo,
	busy,
	action = 'edit',
	photoRef,
	photoStyle,
	badgeStyle,
	placeholderIcon = ImageIcon,
}: Props) => {
	const { t } = useTranslation();

	const [sheetOpen, setSheetOpen] = useState(false);

	const ActionIcon = actionIcons[action];

	const handleTakePhoto = () => {
		setSheetOpen(false);

		void photo.take();
	};

	const handleChoosePhoto = () => {
		setSheetOpen(false);

		void photo.choose();
	};

	return (
		<View style={styles.container}>
			<PressableSurface
				accessibilityLabel={t('common.profilePhoto.select')}
				disabled={busy}
				onPress={() => setSheetOpen(true)}
				cornerRadius="pill"
				depth="none"
			>
				<Animated.View ref={photoRef} style={photoStyle}>
					<Avatar uri={photo.photoUri} icon={placeholderIcon} size="xlarge" />
				</Animated.View>
				<Animated.View style={[styles.photoBadge, badgeStyle]}>
					<ActionIcon size={20} color={colors.onFilled} />
				</Animated.View>
			</PressableSurface>
			<InlineError message={photo.errorMessage} />

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

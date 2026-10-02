import { useRef, useState } from 'react';

import { Image, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import type usePhotoPicker from '@/hooks/use-photo-picker';

import { useTranslation } from 'react-i18next';

import { PencilIcon, PlusIcon } from 'lucide-react-native';
import Animated, {
	type AnimatedRef,
	type AnimatedStyle,
	type SharedValue,
	useAnimatedStyle,
} from 'react-native-reanimated';

import ParrotPhotoPlaceholder from '@/screens/onboarding/components/parrot-photo-placeholder';
import { colors, radius } from '@/theme';

import { Item } from '@/components/ui/item';
import { ItemGroup } from '@/components/ui/item/group';
import { Sheet } from '@/components/ui/sheet';
import { Surface } from '@/components/ui/surface';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const MIN_HEIGHT = 240;
const SCROLL_FOLLOW_RATIO = 0.45;

interface Props {
	photo: ReturnType<typeof usePhotoPicker>;
	busy: boolean;
	scrollY: SharedValue<number>;
	photoRef?: AnimatedRef<Animated.View>;
	photoStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
	badgeStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
}

/**
 * 화면 위쪽 앵무새 사진 컴포넌트
 * @param photo usePhotoPicker 결과
 * @param busy 저장 중 여부
 * @param scrollY 화면 스크롤 위치
 * @param photoRef 사진의 화면 위치를 잴 때 쓰는 ref
 * @param photoStyle 사진에 더할 애니메이션 스타일
 * @param badgeStyle 사진 변경 버튼에 더할 애니메이션 스타일
 */
const ParrotPhotoBackdrop = ({ photo, busy, scrollY, photoRef, photoStyle, badgeStyle }: Props) => {
	const { t } = useTranslation();

	const [sheetOpen, setSheetOpen] = useState(false);

	const pendingPickRef = useRef<(() => Promise<void>) | null>(null);

	const BadgeIcon = photo.photoUri ? PencilIcon : PlusIcon;

	const followStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: scrollY.get() * (1 - SCROLL_FOLLOW_RATIO) }],
	}));

	const handleTakePhoto = () => {
		pendingPickRef.current = photo.take;
		setSheetOpen(false);
	};

	const handleChoosePhoto = () => {
		pendingPickRef.current = photo.choose;
		setSheetOpen(false);
	};

	/** 시트가 닫히는 애니메이션이 끝난 뒤 카메라나 앨범을 열어야 다음에 시트가 다시 열림 */
	const handleCloseSheet = () => {
		const pick = pendingPickRef.current;

		pendingPickRef.current = null;
		setSheetOpen(false);

		void pick?.();
	};

	return (
		<View style={styles.container}>
			<Animated.View style={[styles.photoContainer, followStyle]}>
				<Animated.View ref={photoRef} style={[styles.photo, !photo.photoUri && styles.emptyPhoto, photoStyle]}>
					{photo.photoUri ? (
						<Image source={{ uri: photo.photoUri }} style={styles.image} accessibilityIgnoresInvertColors />
					) : (
						<ParrotPhotoPlaceholder />
					)}
				</Animated.View>
			</Animated.View>

			<PressableSurface
				accessibilityLabel={t('common.profilePhoto.select')}
				disabled={busy}
				onPress={() => setSheetOpen(true)}
				variant="plain"
				depth="none"
				cornerRadius="none"
				style={StyleSheet.absoluteFill}
				contentStyle={styles.pressArea}
			>
				<Animated.View style={[styles.badge, badgeStyle]}>
					<Surface variant="primary" cornerRadius="pill" contentStyle={styles.badgeFace}>
						<BadgeIcon size={22} color={colors.onFilled} />
					</Surface>
				</Animated.View>
			</PressableSurface>

			<Sheet visible={sheetOpen} title={t('common.profilePhoto.title')} onClose={handleCloseSheet}>
				<ItemGroup>
					<Item first label={t('common.profilePhoto.take')} onPress={handleTakePhoto} />
					<Item label={t('common.profilePhoto.choose')} onPress={handleChoosePhoto} />
				</ItemGroup>
			</Sheet>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flexGrow: 1, minHeight: MIN_HEIGHT },
	// 시트의 둥근 모서리 뒤까지 사진을 늘림
	photoContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: -radius.sheet },
	photo: {
		flex: 1,
		overflow: 'hidden',
		backgroundColor: colors.surface,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptyPhoto: { backgroundColor: colors.orangePale },
	image: { width: '100%', height: '100%' },
	pressArea: { flex: 1 },
	badge: { position: 'absolute', right: 24, bottom: 20 },
	badgeFace: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});

export default ParrotPhotoBackdrop;

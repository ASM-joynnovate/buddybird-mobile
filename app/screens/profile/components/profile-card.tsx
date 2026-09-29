import { StyleSheet, View } from 'react-native';

import { ChevronRightIcon, type LucideIcon } from 'lucide-react-native';

import { colors, font } from '@/theme';

import { Avatar } from '@/components/ui/avatar';
import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props {
	avatar: { uri?: string | null; icon: LucideIcon; size: 'medium' | 'large' };
	title: { text: string; accent?: boolean };
	details: readonly (string | null)[];
	label: string;
	onPress: () => void;
}

/**
 * 사진, 제목, 세부 정보, 오른쪽 화살표를 보여 주는 카드 컴포넌트
 * @param avatar 사진 주소, 사진이 없을 때 보여 줄 아이콘, 크기
 * @param title 제목 글과 강조 여부
 * @param details 제목 아래에 보여 줄 세부 정보
 * @param label 스크린 리더가 읽을 카드 설명
 * @param onPress 카드를 누를 때 실행할 함수
 */
const ProfileCard = ({ avatar, title, details, label, onPress }: Props) => {
	const isLarge = avatar.size === 'large';

	return (
		<PressableSurface
			accessibilityLabel={label}
			depth={isLarge ? 'medium' : 'low'}
			onPress={onPress}
			contentStyle={[styles.card, isLarge ? styles.largeCard : styles.mediumCard]}
		>
			{/*사진*/}
			<Avatar uri={avatar.uri} icon={avatar.icon} size={avatar.size} />

			{/*제목과 세부 정보*/}
			<View style={[styles.textContainer, isLarge && styles.textContainerLarge]}>
				<Copy
					accessibilityRole={isLarge ? 'header' : undefined}
					numberOfLines={isLarge ? undefined : 1}
					style={[isLarge ? styles.largeTitle : styles.mediumTitle, title.accent && styles.accent]}
				>
					{title.text}
				</Copy>
				{details.map((detail) =>
					detail ? (
						<Copy key={detail} style={styles.detail} numberOfLines={1}>
							{detail}
						</Copy>
					) : null,
				)}
			</View>

			{/*오른쪽 화살표*/}
			<ChevronRightIcon size={18} color={colors.subtle} />
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	card: { flexDirection: 'row', alignItems: 'center' },
	mediumCard: { gap: 14, padding: 16 },
	largeCard: { gap: 16, padding: 20 },
	textContainer: { flex: 1, minWidth: 0, gap: 2 },
	textContainerLarge: { gap: 4 },
	mediumTitle: { fontFamily: font.black, fontSize: 18, lineHeight: 24 },
	largeTitle: { fontFamily: font.black, fontSize: 22, lineHeight: 28 },
	accent: { color: colors.orangeDark, fontSize: 18, lineHeight: 24 },
	detail: { fontSize: 14, color: colors.muted },
});

export default ProfileCard;

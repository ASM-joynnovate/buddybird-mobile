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
	onPress(): void;
}

export function ProfileCard({ avatar, title, details, label, onPress }: Props) {
	const isLarge = avatar.size === 'large';

	return (
		<PressableSurface
			accessibilityLabel={label}
			depth={isLarge ? 'high' : 'low'}
			onPress={onPress}
			contentStyle={[styles.card, isLarge ? styles.largeCard : styles.mediumCard]}
		>
			<Avatar uri={avatar.uri} icon={avatar.icon} size={avatar.size} />
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
			<ChevronRightIcon size={18} color={colors.subtle} />
		</PressableSurface>
	);
}

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

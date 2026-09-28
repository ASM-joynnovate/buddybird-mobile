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
	const large = avatar.size === 'large';

	return (
		<PressableSurface
			accessibilityLabel={label}
			depth={large ? 'high' : 'low'}
			onPress={onPress}
			contentStyle={[styles.card, large ? styles.largeCard : styles.mediumCard]}
		>
			<Avatar uri={avatar.uri} icon={avatar.icon} size={avatar.size} />
			<View style={[styles.lines, large && styles.largeLines]}>
				<Copy
					accessibilityRole={large ? 'header' : undefined}
					numberOfLines={large ? undefined : 1}
					style={[large ? styles.largeTitle : styles.mediumTitle, title.accent && styles.accent]}
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
			<ChevronRightIcon size={18} color={colors.disabled} />
		</PressableSurface>
	);
}

const styles = StyleSheet.create({
	card: { flexDirection: 'row', alignItems: 'center' },
	mediumCard: { gap: 14, padding: 16 },
	largeCard: { gap: 16, padding: 20 },
	lines: { flex: 1, minWidth: 0, gap: 2 },
	largeLines: { gap: 4 },
	mediumTitle: { fontFamily: font.black, fontSize: 18, lineHeight: 24 },
	largeTitle: { fontFamily: font.black, fontSize: 22, lineHeight: 28 },
	accent: { color: colors.orangeDark, fontSize: 18, lineHeight: 24 },
	detail: { fontSize: 14, color: colors.muted },
});

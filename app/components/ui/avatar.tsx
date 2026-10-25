import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

import type { LucideIcon } from 'lucide-react-native';

import { colors } from '@/theme';

const sizes = {
	xsmall: { icon: 18, box: 32 },
	small: { icon: 22, box: 40 },
	medium: { icon: 26, box: 64 },
	large: { icon: 34, box: 80 },
	xlarge: { icon: 40, box: 110 },
} as const;

type AvatarSize = keyof typeof sizes;

interface Props {
	uri?: string | null;
	icon: LucideIcon;
	size: AvatarSize;
	uploading?: boolean;
}

export const Avatar = ({ uri, icon: Icon, size, uploading = false }: Props) => {
	const { icon: iconSize, box: boxSize } = sizes[size];

	return (
		<View style={[styles.container, { width: boxSize, height: boxSize, borderRadius: boxSize / 2 }]}>
			{uri ? (
				<Image source={{ uri }} style={styles.image} accessibilityIgnoresInvertColors />
			) : (
				<Icon size={iconSize} color={colors.subtle} />
			)}
			{uploading && (
				<View style={styles.progressContainer}>
					<ActivityIndicator color={colors.onFilled} />
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		overflow: 'hidden',
		backgroundColor: colors.surface,
		alignItems: 'center',
		justifyContent: 'center',
	},
	image: { width: '100%', height: '100%' },
	progressContainer: {
		...StyleSheet.absoluteFill,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.backdrop,
	},
});

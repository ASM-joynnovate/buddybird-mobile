import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

import type { LucideIcon } from 'lucide-react-native';

import { colors } from '@/theme';

const iconSizes = { medium: 26, large: 34, xlarge: 40 } as const;

type AvatarSize = keyof typeof iconSizes;

interface Props {
	uri?: string | null;
	icon: LucideIcon;
	size: AvatarSize;
	uploading?: boolean;
}

const sizeStyle = (size: AvatarSize) => {
	return { medium: styles.medium, large: styles.large, xlarge: styles.xlarge }[size];
};

export const Avatar = ({ uri, icon: Icon, size, uploading = false }: Props) => {
	return (
		<View style={[styles.container, sizeStyle(size)]}>
			{uri ? (
				<Image source={{ uri }} style={styles.image} accessibilityIgnoresInvertColors />
			) : (
				<Icon size={iconSizes[size]} color={colors.subtle} />
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
	medium: { width: 64, height: 64, borderRadius: 32 },
	large: { width: 80, height: 80, borderRadius: 40 },
	xlarge: { width: 110, height: 110, borderRadius: 55 },
	image: { width: '100%', height: '100%' },
	progressContainer: {
		...StyleSheet.absoluteFill,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.backdrop,
	},
});

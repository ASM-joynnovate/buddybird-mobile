import type { ReactNode } from 'react';

import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

const sizes = {
	xsmall: 32,
	small: 40,
	medium: 64,
	large: 80,
	xlarge: 110,
} as const;

const cornerRatios = {
	circle: 0.5,
	rounded: 0.25,
} as const;

type AvatarSize = keyof typeof sizes;
type AvatarShape = keyof typeof cornerRatios;

interface Props {
	uri?: string | null;
	placeholder: ReactNode;
	size: AvatarSize;
	shape?: AvatarShape;
	uploading?: boolean;
}

export const Avatar = ({ uri, placeholder, size, shape = 'circle', uploading = false }: Props) => {
	const boxSize = sizes[size];

	return (
		<View
			style={[styles.container, { width: boxSize, height: boxSize, borderRadius: boxSize * cornerRatios[shape] }]}
		>
			{uri ? <Image source={{ uri }} style={styles.image} accessibilityIgnoresInvertColors /> : placeholder}
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

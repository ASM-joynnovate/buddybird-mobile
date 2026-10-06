import { useState } from 'react';

import { Image, StyleSheet } from 'react-native';

import { Galeria } from '@nandorojo/galeria';

import { colors, radius } from '@/theme';

const DEFAULT_ASPECT_RATIO = 4 / 3;

interface Props {
	index: number;
	uri: string;
	label: string;
}

/**
 * 첨부 사진 컴포넌트
 * @param index 첨부 사진 목록에서의 순서
 * @param uri 사진 주소
 * @param label 스크린 리더가 읽는 이름
 */
const AttachedImagesItem = ({ index, uri, label }: Props) => {
	const [aspectRatio, setAspectRatio] = useState(DEFAULT_ASPECT_RATIO);

	return (
		<Galeria.Image index={index}>
			<Image
				source={{ uri }}
				style={[styles.image, { aspectRatio }]}
				resizeMode="contain"
				accessible
				accessibilityRole="imagebutton"
				accessibilityLabel={label}
				accessibilityIgnoresInvertColors
				onLoad={({ nativeEvent }) => setAspectRatio(nativeEvent.source.width / nativeEvent.source.height)}
			/>
		</Galeria.Image>
	);
};

const styles = StyleSheet.create({
	image: { width: '100%', borderRadius: radius.card, backgroundColor: colors.surface },
});

export default AttachedImagesItem;

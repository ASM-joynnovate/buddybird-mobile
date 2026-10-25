import { Image, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';

const addPhotoImage: number = require('@assets/images/parrot-add-photo.png');

/** 사진 추가 이미지 및 문구 표시 컴포넌트 */
const ParrotPhotoPlaceholder = () => {
	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			<Image source={addPhotoImage} style={styles.image} accessibilityIgnoresInvertColors />
			<Copy style={styles.label}>{t('parrot.addPhoto')}</Copy>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { alignItems: 'center', gap: 10 },
	image: { width: 64, height: 64 },
	label: { fontFamily: font.extraBold, color: colors.orangeDark },
});

export default ParrotPhotoPlaceholder;

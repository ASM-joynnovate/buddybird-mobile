import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { BirdIcon } from 'lucide-react-native';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';

/** 앵무새 사진이 없을 때 보이는 컴포넌트 */
const ParrotPhotoPlaceholder = () => {
	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			<BirdIcon size={64} color={colors.orangeDark} />
			<Copy style={styles.label}>{t('parrot.addPhoto')}</Copy>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { alignItems: 'center', gap: 10 },
	label: { fontFamily: font.extraBold, color: colors.orangeDark },
});

export default ParrotPhotoPlaceholder;

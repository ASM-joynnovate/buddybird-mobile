import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { colors, depths, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';

/** 계정 정보를 불러오는 동안 보이는 컴포넌트 */
const AccountFormSkeleton = () => {
	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			<View style={styles.spacer} />

			{/*프로필 사진 자리*/}
			<View style={styles.photoContainer}>
				<View style={[styles.block, styles.photoBlock]} />
				<View style={styles.badge} />
			</View>

			{/*닉네임 입력창*/}
			<View style={styles.nicknameContainer}>
				<Copy style={ui.label}>{t('profile.nickname')}</Copy>
				<View style={styles.field}>
					<View style={[styles.block, styles.nicknameBlock]} />
				</View>
			</View>

			{/*저장 버튼 자리*/}
			<View style={styles.spacer} />
			<View style={[styles.block, styles.saveBlock]} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, overflow: 'hidden' },
	spacer: { flexGrow: 1, minHeight: 24 },
	block: { borderRadius: radius.small, backgroundColor: colors.surface },
	photoContainer: { alignSelf: 'center', marginBottom: 20, padding: 2 },
	photoBlock: { width: 110, height: 110, borderRadius: radius.pill },
	badge: {
		position: 'absolute',
		right: -2,
		bottom: -2,
		width: 38,
		height: 38,
		borderRadius: radius.pill,
		borderWidth: 3,
		borderColor: colors.background,
		backgroundColor: colors.border,
	},
	nicknameContainer: { marginTop: 32 },
	field: {
		minHeight: 50,
		justifyContent: 'center',
		paddingHorizontal: 16,
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: radius.tile,
		borderCurve: 'continuous',
	},
	nicknameBlock: { width: 96, height: 16 },
	saveBlock: { height: 64, marginTop: 12 + depths.medium, borderRadius: radius.control },
});

export default AccountFormSkeleton;

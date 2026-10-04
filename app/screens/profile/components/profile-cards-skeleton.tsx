import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { ChevronRightIcon } from 'lucide-react-native';

import { CARD_TILTS } from '@/screens/profile/components/profile-cards';
import { colors, depths, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';

/** 프로필을 불러오는 동안 보이는 컴포넌트 */
const ProfileCardsSkeleton = () => {
	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			{/*계정 카드 자리*/}
			<View style={[styles.outline, styles.accountCard]}>
				<View style={[styles.block, styles.avatarBlock]} />
				<View style={styles.accountText}>
					<View style={[styles.block, styles.nicknameBlock]} />
					<View style={[styles.block, styles.emailBlock]} />
				</View>
				<ChevronRightIcon size={18} color={colors.subtle} />
			</View>

			{/*앵무새 카드와 추가 카드 자리*/}
			<View style={ui.sectionContainer}>
				<Copy style={ui.sectionTitle}>{t('profile.parrots')}</Copy>
				<View style={[ui.actionsRow, styles.parrotsRow]}>
					<View
						style={[
							ui.action,
							styles.outline,
							styles.parrotCard,
							{ transform: [{ rotate: `${CARD_TILTS[0]}deg` }] },
						]}
					>
						<View style={[styles.block, styles.photoBlock]} />
						<View style={[styles.block, styles.parrotNameBlock]} />
						<View style={[styles.block, styles.tagBlock]} />
					</View>
					<View
						style={[
							ui.action,
							styles.outline,
							styles.addCard,
							{ transform: [{ rotate: `${CARD_TILTS[1]}deg` }] },
						]}
					>
						<View style={[styles.block, styles.plusBlock]} />
						<Copy style={styles.addLabel}>{t('profile.addParrot')}</Copy>
					</View>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, overflow: 'hidden' },
	outline: {
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: radius.card,
		borderCurve: 'continuous',
	},
	block: { borderRadius: radius.small, backgroundColor: colors.surface },
	accountCard: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
		padding: 20,
		borderBottomWidth: 2 + depths.medium,
	},
	avatarBlock: { width: 80, height: 80, borderRadius: radius.pill },
	accountText: { flex: 1, minWidth: 0, gap: 8 },
	nicknameBlock: { width: 110, height: 22 },
	emailBlock: { width: 150, height: 14 },
	parrotsRow: { paddingTop: 4 },
	parrotCard: { gap: 8, padding: 10, paddingBottom: 12, borderBottomWidth: 2 + depths.low },
	photoBlock: { aspectRatio: 1, borderRadius: radius.control },
	parrotNameBlock: { width: 64, height: 18, marginVertical: 3, marginHorizontal: 2 },
	tagBlock: { width: 52, height: 24, marginHorizontal: 2, borderRadius: radius.pill },
	addCard: {
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		padding: 16,
		borderBottomWidth: 2 + depths.low,
		backgroundColor: colors.surface,
	},
	plusBlock: { width: 52, height: 52 + depths.medium, borderRadius: radius.pill, backgroundColor: colors.border },
	addLabel: { fontFamily: font.extraBold, color: colors.muted },
});

export default ProfileCardsSkeleton;

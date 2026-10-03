import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { BellIcon } from 'lucide-react-native';

import { SESSION_DURATION_PRESETS } from '@/config';
import { colors, depths, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ui } from '@/components/ui/styles';
import { Title } from '@/components/ui/title';

const PLACEHOLDER_WORD_COUNT = 3;
const DURATION_CHOICE_COUNT = SESSION_DURATION_PRESETS.length + 2;

/** 홈을 불러오는 동안 보이는 컴포넌트 */
const HomeSkeleton = () => {
	const { t } = useTranslation();

	return (
		<>
			{/*버디 자리, 브랜드 이름, 알림 아이콘*/}
			<View style={styles.topBar}>
				<View style={[styles.block, styles.mascotBlock]} />
				<Title style={styles.brand}>{t('home.brand')}</Title>
				<View style={styles.bell}>
					<BellIcon size={24} color={colors.text} />
				</View>
			</View>

			<View style={styles.body}>
				<ScreenHeader large title={t('session.start.title')} />

				<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
					{/*단어 카드 자리*/}
					<Copy style={ui.sectionTitle}>{t('session.start.word')}</Copy>
					<View style={styles.wordsRow}>
						{Array.from({ length: PLACEHOLDER_WORD_COUNT }, (_, index) => (
							<View key={index} style={[styles.outline, styles.wordCard]}>
								<View style={[styles.block, styles.initialBlock]} />
								<View style={[styles.block, styles.wordNameBlock]} />
							</View>
						))}
					</View>

					{/*학습 시간 카드 자리*/}
					<Copy style={[ui.sectionTitle, ui.sectionContainer]}>{t('session.start.duration')}</Copy>
					{Array.from({ length: DURATION_CHOICE_COUNT }, (_, index) => (
						<View key={index} style={[styles.outline, styles.durationCard]}>
							<View style={styles.radio} />
							<View style={styles.durationText}>
								<View style={[styles.block, styles.durationTitleBlock]} />
								<View style={[styles.block, styles.durationHintBlock]} />
							</View>
						</View>
					))}
				</View>
			</View>

			{/*학습 시작 버튼 자리*/}
			<View style={[styles.block, styles.startBlock]} />
		</>
	);
};

const styles = StyleSheet.create({
	topBar: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6 },
	mascotBlock: { width: 34, height: 34 },
	brand: { flex: 1, minWidth: 0, fontSize: 20, lineHeight: 26 },
	bell: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
	body: { flex: 1, overflow: 'hidden', paddingTop: 8 },
	block: { borderRadius: radius.small, backgroundColor: colors.surface },
	outline: {
		borderWidth: 2,
		borderBottomWidth: 2 + depths.medium,
		borderColor: colors.border,
		borderRadius: radius.card,
		borderCurve: 'continuous',
	},
	wordsRow: { flexDirection: 'row', gap: 8 },
	wordCard: {
		flex: 1,
		minWidth: 0,
		minHeight: 84 + depths.medium,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		borderRadius: radius.tile,
	},
	initialBlock: { width: 34, height: 34, borderRadius: 12 },
	wordNameBlock: { width: 44, height: 12 },
	durationCard: {
		minHeight: 76 + depths.medium,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		padding: 16,
		marginBottom: 8,
	},
	radio: { width: 25, height: 25, borderRadius: radius.pill, borderWidth: 3, borderColor: colors.border },
	durationText: { flex: 1, minWidth: 0, gap: 8 },
	durationTitleBlock: { width: 72, height: 16 },
	durationHintBlock: { width: 160, height: 12 },
	startBlock: { height: 64, marginTop: 12 + depths.xhigh, borderRadius: radius.control },
});

export default HomeSkeleton;

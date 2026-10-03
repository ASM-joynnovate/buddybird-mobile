import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { CircleQuestionMarkIcon, TrashIcon } from 'lucide-react-native';

import { colors, depths, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { ItemGroup } from '@/components/ui/item/group';
import { ui } from '@/components/ui/styles';

const PLACEHOLDER_RECORDING_COUNT = 2;

/** 단어 편집 내용을 불러오는 동안 보이는 컴포넌트 */
const WordEditorSkeleton = () => {
	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			{/*단어 이름 입력창*/}
			<Copy style={ui.label}>{t('words.editor.name')}</Copy>
			<View style={styles.field}>
				<View style={[styles.block, styles.nameBlock]} />
			</View>

			{/*녹음 목록 자리*/}
			<View
				style={ui.sectionContainer}
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
			>
				<View style={styles.recordingsHeader}>
					<View style={[styles.block, styles.recordingsTitleBlock]} />
					<View style={styles.iconBox}>
						<CircleQuestionMarkIcon size={24} color={colors.muted} />
					</View>
				</View>

				<ItemGroup>
					{Array.from({ length: PLACEHOLDER_RECORDING_COUNT }, (_, index) => (
						<View key={index} style={[styles.recordingRow, index > 0 && styles.divider]}>
							<View style={styles.recordingText}>
								<View style={[styles.block, styles.recordingNameBlock]} />
								<View style={[styles.block, styles.durationBlock]} />
							</View>
							<View style={styles.iconBox}>
								<TrashIcon size={24} color={colors.muted} />
							</View>
							<View style={[styles.block, styles.playBlock]} />
						</View>
					))}
				</ItemGroup>

				<View style={styles.addButton} />
			</View>

			{/*저장 버튼 자리*/}
			<View style={styles.spacer} />
			<View style={[styles.block, styles.saveBlock]} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, overflow: 'hidden' },
	block: { borderRadius: radius.small, backgroundColor: colors.surface },
	field: {
		minHeight: 50,
		justifyContent: 'center',
		paddingHorizontal: 16,
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: radius.tile,
		borderCurve: 'continuous',
	},
	nameBlock: { width: 64, height: 16 },
	recordingsHeader: { minHeight: 48, flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
	recordingsTitleBlock: { flex: 1, maxWidth: 72, height: 18, marginRight: 'auto' },
	iconBox: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
	recordingRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingVertical: 10,
		paddingLeft: 16,
		paddingRight: 8,
	},
	divider: { borderTopWidth: 2, borderTopColor: colors.border },
	recordingText: { flex: 1, minWidth: 0, gap: 6 },
	recordingNameBlock: { width: 52, height: 16 },
	durationBlock: { width: 36, height: 13 },
	playBlock: { width: 44, height: 44, marginBottom: depths.medium, borderRadius: radius.pill },
	addButton: {
		minHeight: 52 + depths.medium,
		marginTop: 12,
		borderWidth: 2,
		borderBottomWidth: 2 + depths.medium,
		borderColor: colors.border,
		borderRadius: radius.control,
		borderCurve: 'continuous',
	},
	spacer: { flex: 1, minHeight: 24 },
	saveBlock: { height: 64, marginTop: 12 + depths.medium, borderRadius: radius.control },
});

export default WordEditorSkeleton;

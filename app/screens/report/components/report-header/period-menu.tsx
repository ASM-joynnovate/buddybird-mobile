import { useRef, useState } from 'react';

import { Modal, StyleSheet, useWindowDimensions, View } from 'react-native';

import type { ReportPeriod } from '@/types/report-period';
import { reportPeriodSchema } from '@/types/report-period';

import { useTranslation } from 'react-i18next';

import { CheckIcon, ChevronDownIcon } from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useReportStore } from '@/stores/report';
import { colors, font } from '@/theme';
import { joinLabel } from '@/utils/a11y';

import { Copy } from '@/components/ui/copy';
import { Surface } from '@/components/ui/surface';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const MENU_GAP = 8;

/** 기간 단위 선택 메뉴 컴포넌트 */
const PeriodMenu = () => {
	const { t } = useTranslation();

	const buttonRef = useRef<View>(null);

	const [menuOpen, setMenuOpen] = useState(false);
	const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

	const { width: windowWidth } = useWindowDimensions();

	const period = useReportStore((state) => state.period);
	const selectPeriod = useReportStore((state) => state.selectPeriod);

	const handleOpenMenu = () => {
		buttonRef.current?.measureInWindow((x, y, width, height) => {
			setMenuPosition({ top: y + height + MENU_GAP, right: windowWidth - x - width });
			setMenuOpen(true);
		});
	};

	// 닫히며 흐려지는 동안 목록이 제자리에 있도록 위치는 지우지 않음
	const handleSelectPeriod = (periodOption: ReportPeriod) => {
		setMenuOpen(false);
		selectPeriod(periodOption);
	};

	return (
		<>
			<View ref={buttonRef} collapsable={false}>
				<PressableSurface
					accessibilityRole="button"
					accessibilityLabel={joinLabel(t('report.unit'), t(`report.units.${period}`))}
					accessibilityState={{ expanded: menuOpen }}
					onPress={handleOpenMenu}
					depth="low"
					cornerRadius="pill"
					hitSlop={6}
					contentStyle={styles.button}
				>
					<Copy style={styles.buttonText}>{t(`report.units.${period}`)}</Copy>
					<View style={menuOpen ? styles.openedChevron : undefined}>
						<ChevronDownIcon size={18} color={colors.muted} />
					</View>
				</PressableSurface>
			</View>

			<Modal
				statusBarTranslucent
				navigationBarTranslucent
				visible={menuOpen}
				transparent
				animationType="fade"
				onRequestClose={() => setMenuOpen(false)}
			>
				<GestureHandlerRootView style={styles.modalRoot}>
					{/*메뉴 밖을 누르면 닫힘*/}
					<PressableSurface
						variant="plain"
						depth="none"
						cornerRadius="none"
						accessibilityLabel={t('common.close')}
						onPress={() => setMenuOpen(false)}
						style={StyleSheet.absoluteFill}
						contentStyle={styles.modalRoot}
					>
						{null}
					</PressableSurface>

					<Surface
						accessibilityRole="menu"
						accessibilityViewIsModal
						depth="low"
						cornerRadius="control"
						style={[styles.menu, menuPosition]}
						contentStyle={styles.menuContent}
					>
						{reportPeriodSchema.options.map((periodOption) => {
							const selected = period === periodOption;

							return (
								<PressableSurface
									key={periodOption}
									accessibilityRole="menuitem"
									accessibilityLabel={t(`report.units.${periodOption}`)}
									accessibilityState={{ checked: selected }}
									onPress={() => handleSelectPeriod(periodOption)}
									variant="plain"
									depth="none"
									cornerRadius="small"
									faceColor={selected ? colors.orangePale : undefined}
									contentStyle={styles.menuItem}
								>
									<Copy style={[styles.menuItemText, selected && styles.selectedText]}>
										{t(`report.units.${periodOption}`)}
									</Copy>
									{selected && <CheckIcon size={18} strokeWidth={3} color={colors.orangeDark} />}
								</PressableSurface>
							);
						})}
					</Surface>
				</GestureHandlerRootView>
			</Modal>
		</>
	);
};

const styles = StyleSheet.create({
	button: {
		minHeight: 32,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 2,
		paddingLeft: 14,
		paddingRight: 8,
	},
	buttonText: { fontFamily: font.extraBold, fontSize: 13.5 },
	openedChevron: { transform: [{ rotate: '180deg' }] },
	modalRoot: { flex: 1 },
	menu: { position: 'absolute', minWidth: 148 },
	menuContent: { padding: 4 },
	menuItem: {
		minHeight: 44,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12,
		paddingLeft: 12,
		paddingRight: 10,
	},
	menuItemText: { fontFamily: font.extraBold, fontSize: 14.5 },
	selectedText: { color: colors.orangeDark },
});

export default PeriodMenu;

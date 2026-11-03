import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import { colors, font, radius } from '@/theme';

import { MASCOT_FOOT_Y, MASCOT_SIZE } from '@/components/buddy-refresh/constants';
import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const CORD_INSET = 22;

interface Props {
	cordLength: number;
	mascot?: ReactNode;
	action?: { label: string; onPress: () => void };
	children: ReactNode;
}

/**
 * 줄에 매달린 버디 안내 팻말 컴포넌트
 * @param cordLength 팻말 위 줄 길이
 * @param mascot 팻말 위 버디
 * @param action 팻말 오른쪽 버튼
 * @param children 팻말 문구
 */
const BuddySign = ({ cordLength, mascot, action, children }: Props) => {
	return (
		<View>
			{!!mascot && (
				<>
					<View style={[styles.cord, styles.leftCord, { height: cordLength }]} />
					<View style={[styles.cord, styles.rightCord, { height: cordLength }]} />
				</>
			)}

			<View style={styles.sign}>
				<View style={styles.body}>{children}</View>

				{action && (
					<PressableSurface
						accessibilityLabel={action.label}
						onPress={action.onPress}
						variant="plain"
						depth="none"
						cornerRadius="none"
						style={styles.action}
						contentStyle={styles.actionFace}
					>
						<Copy style={styles.actionLabel}>{action.label}</Copy>
					</PressableSurface>
				)}
			</View>

			{!!mascot && (
				<View pointerEvents="none" style={styles.mascot}>
					{mascot}
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	cord: { position: 'absolute', bottom: '100%', width: 2, borderRadius: 1, backgroundColor: colors.text },
	leftCord: { left: CORD_INSET },
	rightCord: { right: CORD_INSET },
	sign: {
		flexDirection: 'row',
		minHeight: 44,
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: radius.tile,
		borderCurve: 'continuous',
		backgroundColor: colors.background,
	},
	body: {
		flexShrink: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingVertical: 8,
		paddingRight: 16,
		paddingLeft: 12,
	},
	action: { borderLeftWidth: 2, borderLeftColor: colors.border },
	actionFace: { flex: 1, minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderWidth: 0 },
	actionLabel: { fontFamily: font.extraBold, fontSize: 15, color: colors.orangeDark },
	mascot: {
		position: 'absolute',
		top: 1 - MASCOT_FOOT_Y,
		alignSelf: 'center',
		width: MASCOT_SIZE,
		height: MASCOT_SIZE,
	},
});

export default BuddySign;

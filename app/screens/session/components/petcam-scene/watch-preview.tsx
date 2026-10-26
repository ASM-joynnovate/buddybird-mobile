import { Image, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { formatTimer } from '@/i18n/format';

import { CameraIcon, ChevronLeftIcon } from 'lucide-react-native';

import { MINUTE } from '@/config/units';
import SessionRunInfoProgressArc from '@/screens/session/components/session-run-info/progress-arc';
import { font, radius } from '@/theme';
import { sessionColors } from '@/theme/session-colors';

import { Copy } from '@/components/ui/copy';

const feedPhoto: number = require('@assets/images/petcam-guide/watch-feed.jpg');

const ARC_WIDTH = 345;

/** 내 폰의 학습 보기 화면 예시 컴포넌트 */
const PetcamSceneWatchPreview = () => {
	const { t } = useTranslation();

	return (
		<>
			<Image accessibilityIgnoresInvertColors source={feedPhoto} resizeMode="cover" style={styles.feed} />

			<View style={styles.header}>
				<View style={styles.leave}>
					<ChevronLeftIcon size={22} color={sessionColors.overlayText} />
					<Copy style={styles.leaveText}>{t('session.watch.leave')}</Copy>
				</View>
				<View style={styles.camera}>
					<CameraIcon size={20} color={sessionColors.cameraOn} />
				</View>
			</View>

			<View style={styles.pauseContainer}>
				<Copy style={styles.pauseText}>{t('session.watch.learningPaused')}</Copy>
			</View>

			<View style={styles.bottom}>
				<SessionRunInfoProgressArc width={ARC_WIDTH} variant="half" phase="learning" progressRatio={0.32}>
					<View style={styles.time}>
						<Copy style={styles.timeLabel}>{t('session.run.remaining')}</Copy>
						<Copy style={styles.timeText}>{formatTimer(95 * MINUTE)}</Copy>
					</View>
				</SessionRunInfoProgressArc>
				<View style={styles.endButton}>
					<Copy style={styles.endText}>{t('session.end.button')}</Copy>
				</View>
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	feed: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
	header: {
		position: 'absolute',
		top: 71,
		right: 24,
		left: 24,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	leave: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: -6 },
	leaveText: { fontFamily: font.extraBold, fontSize: 16, color: sessionColors.overlayText },
	camera: {
		width: 48,
		height: 54,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 2,
		borderBottomWidth: 8,
		borderColor: sessionColors.cameraOnEdge,
		borderRadius: radius.pill,
		backgroundColor: sessionColors.background,
	},
	pauseContainer: {
		...StyleSheet.absoluteFill,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24,
	},
	pauseText: {
		fontFamily: font.extraBold,
		fontSize: 17,
		lineHeight: 26,
		textAlign: 'center',
		color: sessionColors.text,
	},
	bottom: { position: 'absolute', right: 24, bottom: 50, left: 24, gap: 16 },
	time: { alignItems: 'center', gap: 2 },
	timeLabel: { fontFamily: font.extraBold, fontSize: 15, color: sessionColors.faint },
	timeText: {
		fontFamily: font.black,
		fontSize: 34,
		lineHeight: 40,
		color: sessionColors.text,
		fontVariant: ['tabular-nums'],
	},
	endButton: {
		minHeight: 70,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 2,
		borderBottomWidth: 8,
		borderColor: sessionColors.edge,
		borderRadius: radius.control,
		borderCurve: 'continuous',
		backgroundColor: sessionColors.background,
	},
	endText: { fontFamily: font.extraBold, fontSize: 20, color: sessionColors.text },
});

export default PetcamSceneWatchPreview;

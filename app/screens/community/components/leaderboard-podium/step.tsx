import { useEffect, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { LeaderboardItem } from '@/types/apis/leaderboard';

import { useTranslation } from 'react-i18next';

import { formatNumber } from '@/i18n/format';

import { CrownIcon } from 'lucide-react-native';
import Animated, { FadeIn, Keyframe, useSharedValue, withDelay } from 'react-native-reanimated';
import Svg, { Polygon } from 'react-native-svg';

import { leaderboardScoreText } from '@/screens/community/utils/leaderboard';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { burstEasing, colors, font, radius } from '@/theme';
import { joinLabel } from '@/utils/a11y';

import { glintSweep, popIn } from '@/components/burst-animations';
import Glint from '@/components/glint';
import MascotArtwork from '@/components/mascot/artwork';
import { Avatar } from '@/components/ui/avatar';
import { Copy } from '@/components/ui/copy';
import { Flag } from '@/components/ui/flag';

const MIN_FRONT_HEIGHT = 44;
const FRONT_HEIGHT_RANGE = 26;
const RISE_DISTANCE = 96;
const RISE_STAGGER_MS = 120;
const PHOTO_DELAY_MS = 300;
const CROWN_DELAY_MS = 250;
const SCORE_DELAY_MS = 400;
const GLINT_DELAY_MS = 1140;

const placeColors = {
	1: { face: colors.yellow, topFace: colors.yellowLight, text: colors.yellowText },
	2: { face: colors.silver, topFace: colors.silverLight, text: colors.silverText },
	3: { face: colors.bronze, topFace: colors.bronzeLight, text: colors.bronzeText },
} as const;

/** 바닥에서 올라오는 시상대 애니메이션 */
const podiumRise = () => {
	return new Keyframe({
		0: { transform: [{ translateY: RISE_DISTANCE }] },
		100: { transform: [{ translateY: 0 }], easing: burstEasing },
	}).duration(450);
};

/** 기울어진 채 내려앉는 왕관 애니메이션 */
const crownDrop = () => {
	return new Keyframe({
		0: { opacity: 0, transform: [{ translateY: -14 }, { rotate: '-12deg' }] },
		100: { opacity: 1, transform: [{ translateY: 0 }, { rotate: '0deg' }], easing: burstEasing },
	}).duration(450);
};

interface Props {
	place: keyof typeof placeColors;
	rankEntry: LeaderboardItem | undefined;
	topScore: number;
	isMe: boolean;
}

/**
 * 시상대 칸 컴포넌트
 * @param place 시상대 자리
 * @param rankEntry 자리의 순위 항목
 * @param topScore 1위의 학습 시간 밀리초
 * @param isMe 내 순위인지 여부
 */
const LeaderboardPodiumStep = ({ place, rankEntry, topScore, isMe }: Props) => {
	const { t } = useTranslation();

	const [frontWidth, setFrontWidth] = useState(0);

	const glint = useSharedValue(0);

	const locale = useDeviceSettingsStore((state) => state.locale);

	const isFirst = place === 1;
	const riseDelay = (3 - place) * RISE_STAGGER_MS;
	const photoDelay = riseDelay + PHOTO_DELAY_MS;
	const placeColor = placeColors[place];
	const frontHeight =
		rankEntry &&
		MIN_FRONT_HEIGHT + (topScore > 0 ? Math.round((FRONT_HEIGHT_RANGE * rankEntry.score) / topScore) : 0);
	const rankText = rankEntry && formatNumber(rankEntry.rank, locale);
	const scoreText = rankEntry && leaderboardScoreText(rankEntry.score, locale);

	/** 1위 칸 등장 후 빛줄기 실행 */
	useEffect(() => {
		if (isFirst) {
			glint.set(withDelay(GLINT_DELAY_MS, glintSweep()));
		}
	}, [glint, isFirst]);

	return (
		<View
			accessible={!!rankEntry}
			accessibilityLabel={rankEntry && joinLabel(rankText, rankEntry.user.nickname, scoreText)}
			style={styles.container}
		>
			{rankEntry ? (
				<>
					{isFirst && (
						<Animated.View entering={crownDrop().delay(photoDelay + CROWN_DELAY_MS)} style={styles.crown}>
							<CrownIcon size={18} color={colors.yellow} fill={colors.yellow} />
						</Animated.View>
					)}

					<Animated.View entering={popIn().delay(photoDelay)} style={styles.profile}>
						<View
							style={[
								styles.photoBorder,
								{ borderColor: placeColor.face, backgroundColor: placeColor.face },
							]}
						>
							<Avatar
								uri={rankEntry.user.photo_file?.url ?? null}
								placeholder=<MascotArtwork />
								size={isFirst ? 'small' : 'xsmall'}
								shape="rounded"
							/>
						</View>

						<View style={[styles.namePill, { backgroundColor: placeColor.face }]}>
							<Copy numberOfLines={1} style={[styles.nickname, { color: placeColor.text }]}>
								{rankEntry.user.nickname}
							</Copy>
							{isMe ? (
								<Copy style={styles.me}>{t('community.me')}</Copy>
							) : (
								<Flag country={rankEntry.user.country} size="small" />
							)}
						</View>
					</Animated.View>
				</>
			) : (
				<Animated.View
					entering={FadeIn.delay(photoDelay)}
					style={[styles.emptyPhoto, isFirst ? styles.emptyPhotoLarge : styles.emptyPhotoSmall]}
				/>
			)}

			<View style={styles.base}>
				<Animated.View entering={podiumRise().delay(riseDelay)}>
					<Svg width="100%" height={8} viewBox="0 0 10 1" preserveAspectRatio="none" style={styles.topFace}>
						<Polygon points="1,0 9,0 10,1 0,1" fill={rankEntry ? placeColor.topFace : colors.surface} />
					</Svg>
					{rankEntry ? (
						<View
							onLayout={isFirst ? (event) => setFrontWidth(event.nativeEvent.layout.width) : undefined}
							style={[styles.front, { height: frontHeight, backgroundColor: placeColor.face }]}
						>
							{isFirst && <Glint progress={glint} width={frontWidth} />}
							<Copy style={[styles.rank, { color: placeColor.text }]}>{rankText}</Copy>
							<Animated.View entering={FadeIn.delay(riseDelay + SCORE_DELAY_MS)}>
								<Copy style={[styles.score, { color: placeColor.text }]}>{scoreText}</Copy>
							</Animated.View>
						</View>
					) : (
						<View style={styles.emptyFront} />
					)}
				</Animated.View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, minWidth: 0, alignItems: 'center' },
	crown: { marginBottom: 4 },
	profile: { width: '100%', alignItems: 'center' },
	photoBorder: { borderWidth: 3, borderRadius: radius.tile, borderCurve: 'continuous' },
	namePill: {
		maxWidth: '96%',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		marginTop: 6,
		paddingVertical: 3,
		paddingHorizontal: 8,
		borderRadius: radius.pill,
	},
	nickname: { flexShrink: 1, fontFamily: font.extraBold, fontSize: 12 },
	me: { fontFamily: font.extraBold, fontSize: 11, color: colors.orangeDark },
	base: { width: '100%', overflow: 'hidden' },
	topFace: { marginTop: 10 },
	front: {
		alignItems: 'center',
		justifyContent: 'space-between',
		overflow: 'hidden',
		paddingTop: 4,
		paddingBottom: 7,
	},
	rank: { fontFamily: font.black, fontSize: 20, lineHeight: 24, fontVariant: ['tabular-nums'] },
	score: {
		paddingVertical: 2,
		paddingHorizontal: 7,
		borderRadius: radius.pill,
		backgroundColor: colors.shade,
		fontFamily: font.black,
		fontSize: 11,
		fontVariant: ['tabular-nums'],
	},
	emptyPhoto: {
		borderWidth: 2,
		borderStyle: 'dashed',
		borderColor: colors.border,
		borderRadius: radius.tile,
		borderCurve: 'continuous',
	},
	emptyPhotoLarge: { width: 46, height: 46 },
	emptyPhotoSmall: { width: 38, height: 38 },
	emptyFront: { height: 16, backgroundColor: colors.border },
});

export default LeaderboardPodiumStep;

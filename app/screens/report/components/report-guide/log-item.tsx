import { useEffect, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { ReportGuideSound, ReportGuideTargetRegister } from '@/types/guide/report';

import useSoundPlayer from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { Asset } from 'expo-asset';
import { CheckIcon, PauseIcon, PlayIcon, XIcon } from 'lucide-react-native';

import { SECOND } from '@/config/units';
import ReportGuideTarget from '@/screens/report/components/report-guide/target';
import { reportError } from '@/services/telemetry/client';
import { colors } from '@/theme';
import { sessionDetailColors } from '@/theme/session-detail-colors';

import GuideSceneSessionPreviewShares from '@/components/guide-scene/session-preview/shares';
import SessionLogItemHead from '@/components/session/session-log-item-head';
import SessionLogSoundTrack from '@/components/session/session-log-sound-track';
import { Button } from '@/components/ui/button';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const PLAY_SIZE = 36;
const SOUND_ID = 'report-guide';

interface Props {
	wordName: string;
	sound: ReportGuideSound;
	open: boolean;
	onRegisterTarget: ReportGuideTargetRegister;
	onOpen: () => void;
	onPlayEnd: () => void;
	onReview: () => void;
}

/**
 * 소리 재생이 가능한 예시 기록 컴포넌트
 * @param wordName 예시 단어
 * @param sound 예시 소리 파일 및 길이
 * @param open 펼쳤는지 여부
 * @param onRegisterTarget 강조 영역 등록 함수
 * @param onOpen 기록을 누르면 실행할 함수
 * @param onPlayEnd 재생이 끝나면 실행할 함수
 * @param onReview 틀렸어요 또는 맞았어요를 누르면 실행할 함수
 */
const ReportGuideLogItem = ({ wordName, sound, open, onRegisterTarget, onOpen, onPlayEnd, onReview }: Props) => {
	const { t } = useTranslation();

	const [reviewIsCorrect, setReviewIsCorrect] = useState<boolean | null>(null);

	const { playingId, finishedIds, failedId, progress, play, stop } = useSoundPlayer();

	const playing = playingId === SOUND_ID;
	const playFinished = finishedIds.has(SOUND_ID);
	const playFailed = failedId === SOUND_ID;
	const PlayStateIcon = playing ? PauseIcon : PlayIcon;

	/** 재생 종료 또는 실패 시 onPlayEnd 실행 */
	useEffect(() => {
		if (playFinished || playFailed) {
			onPlayEnd();
		}
	}, [onPlayEnd, playFailed, playFinished]);

	const handleTogglePlay = () => {
		if (playing) {
			stop();

			return;
		}

		Asset.loadAsync(sound.file)
			.then(([soundAsset]) => play(SOUND_ID, soundAsset.localUri ?? soundAsset.uri))
			.catch((error: unknown) => {
				reportError(error, 'sound_playback');
				onPlayEnd();
			});
	};

	const handleSelectReview = (isCorrect: boolean) => {
		setReviewIsCorrect(isCorrect);
		onReview();
	};

	return (
		<View style={[styles.container, open && styles.openContainer]}>
			<PressableSurface
				accessibilityState={{ expanded: open }}
				onPress={onOpen}
				variant="plain"
				depth="none"
				cornerRadius="none"
				contentStyle={styles.face}
			>
				<SessionLogItemHead
					kind="mimic"
					name={wordName}
					value={t('report.detail.percent', { value: 92 })}
					time="15:33:05"
					open={open}
					dividerShown
				/>
			</PressableSurface>

			{open && (
				<View style={styles.body}>
					<View style={styles.player}>
						<SessionLogSoundTrack
							accent={colors.orange}
							progress={playing ? progress : 0}
							durationText={t('common.duration.seconds', {
								value: sound.durationMs / SECOND,
								formatParams: { value: { minimumFractionDigits: 1, maximumFractionDigits: 1 } },
							})}
						/>

						<ReportGuideTarget step="play" onRegister={onRegisterTarget}>
							<PressableSurface
								accessibilityLabel={
									playing ? t('common.sound.stopNamed', { name: wordName }) : wordName
								}
								onPress={handleTogglePlay}
								depth="none"
								cornerRadius="pill"
								faceColor={colors.orange}
								edgeColor={colors.orange}
								style={styles.playButton}
								contentStyle={styles.playFace}
							>
								<PlayStateIcon size={13} color={colors.onFilled} fill={colors.onFilled} />
							</PressableSurface>
						</ReportGuideTarget>
					</View>

					<ReportGuideTarget step="review" onRegister={onRegisterTarget}>
						<View style={styles.review}>
							<Button
								label={t('report.detail.reviewWrong')}
								icon={XIcon}
								variant={reviewIsCorrect === false ? 'danger' : 'secondary'}
								size="small"
								accessibilityState={{ selected: reviewIsCorrect === false }}
								onPress={() => handleSelectReview(false)}
								style={styles.button}
							/>
							<Button
								label={t('report.detail.reviewCorrect')}
								icon={CheckIcon}
								variant={reviewIsCorrect === true ? 'success' : 'secondary'}
								size="small"
								accessibilityState={{ selected: reviewIsCorrect === true }}
								onPress={() => handleSelectReview(true)}
								style={styles.button}
							/>
						</View>
					</ReportGuideTarget>

					<ReportGuideTarget step="share" onRegister={onRegisterTarget}>
						<GuideSceneSessionPreviewShares feedShareShown />
					</ReportGuideTarget>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { paddingHorizontal: 14 },
	openContainer: { backgroundColor: sessionDetailColors.openFace },
	face: { borderWidth: 0 },
	body: { paddingBottom: 18 },
	player: { flexDirection: 'row', alignItems: 'center', gap: 24 },
	playButton: { width: PLAY_SIZE, height: PLAY_SIZE },
	playFace: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 0 },
	review: { flexDirection: 'row', gap: 10, marginTop: 14 },
	button: { flex: 1 },
});

export default ReportGuideLogItem;

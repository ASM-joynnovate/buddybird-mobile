import { useState } from 'react';

import { Share, StyleSheet, View } from 'react-native';

import type { SessionSound } from '@/types/apis/sessions';

import type { SoundPlayer } from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { formatMonthDayTime } from '@/i18n/format';

import dayjs from 'dayjs';

import { reportError, track } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { InlineError } from '@/components/ui/inline-error';
import { PlayButton } from '@/components/ui/play-button';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';
import { Tag } from '@/components/ui/tag';

interface Props {
	sound: SessionSound;
	wordName: string;
	multiDay: boolean;
	player: SoundPlayer;
}

/**
 * 앵무새가 따라 한 소리의 녹음 시각, 단어, 재생 버튼을 보여 주고 재생 버튼을 누르면 재생하거나 멈추며 길게 누르면 공유하는 컴포넌트
 * @param sound 앵무새가 따라 한 소리
 * @param wordName 소리가 판정된 단어 이름
 * @param multiDay 여러 날에 걸친 세션 여부
 * @param player 녹음을 재생하고 멈추는 useSoundPlayer 결과
 */
const SoundItem = ({ sound, wordName, multiDay, player }: Props) => {
	const { t } = useTranslation();

	const [shareFailed, setShareFailed] = useState(false);

	const locale = useDeviceSettingsStore((state) => state.locale);

	const playing = player.playingId === sound.id;
	const url = sound.audio.url;
	const timeLabel = multiDay ? formatMonthDayTime(sound.captured_at, locale) : dayjs(sound.captured_at).format('LT');

	let errorMessage: string | null = null;

	if (player.failedId === sound.id) {
		errorMessage = t('common.sound.playError');
	} else if (shareFailed) {
		errorMessage = t('report.detail.shareError');
	}

	/** 소리 주소 공유와 공유 완료 시 mimicry_shared 전송 */
	const handleShare = async () => {
		if (!url) {
			return;
		}

		try {
			setShareFailed(false);

			const shareResult = await Share.share({ url, message: url });

			if (shareResult.action === Share.sharedAction) {
				track('mimicry_shared', { session_id: sound.session_id });
			}
		} catch (e) {
			reportError(e, 'mimicry_share');

			setShareFailed(true);
		}
	};

	/** 소리 재생이나 멈춤과 재생 시작 시 mimicry_played 전송 */
	const handlePlay = () => {
		if (!url) {
			return;
		}

		if (!playing) {
			track('mimicry_played', { session_id: sound.session_id });
		}

		player.toggle(sound.id, url);
	};

	return (
		<View>
			{/*길게 누르면 공유하는 녹음 시각, 단어, 재생 버튼*/}
			<PressableSurface
				accessibilityLabel={timeLabel}
				accessibilityHint={url ? t('report.detail.shareHint') : undefined}
				onPress={() => {}}
				onLongPress={url ? () => void handleShare() : undefined}
				disabled={!url}
				variant="plain"
				depth="none"
				cornerRadius="control"
				contentStyle={styles.soundRow}
			>
				{/*녹음 시각과 단어*/}
				<View style={styles.textContainer}>
					<Copy style={styles.time}>{timeLabel}</Copy>
					<Tag variant="primary" label={wordName} />
				</View>

				{/*재생 버튼*/}
				<PlayButton
					playing={playing}
					label={
						url
							? t(playing ? 'common.sound.stop' : 'report.detail.playSound', {
									time: timeLabel,
								})
							: t('report.detail.soundExpired')
					}
					disabled={!url}
					onPress={handlePlay}
				/>
			</PressableSurface>

			{/*재생이나 공유 실패 안내*/}
			<InlineError message={errorMessage} />
		</View>
	);
};

const styles = StyleSheet.create({
	soundRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		minHeight: 60,
		paddingVertical: 8,
		paddingHorizontal: 4,
		borderWidth: 0,
	},
	textContainer: { flex: 1, minWidth: 0, gap: 6 },
	time: {
		fontFamily: font.extraBold,
		fontSize: 14,
		color: colors.text,
		fontVariant: ['tabular-nums'],
	},
});

export default SoundItem;

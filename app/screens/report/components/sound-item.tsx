import { useState } from 'react';

import { Share, StyleSheet, View } from 'react-native';

import type { SessionSound } from '@/types/apis/sessions';

import type { SoundPlayer } from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { formatDateTime } from '@/i18n/format';

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

export function SoundItem({ sound, wordName, multiDay, player }: Props) {
	const { t } = useTranslation();

	const [shareFailed, setShareFailed] = useState(false);

	const locale = useDeviceSettingsStore((state) => state.locale);

	const playing = player.playingId === sound.id;
	const url = sound.audio.url;
	const timeLabel = multiDay ? formatDateTime(sound.captured_at, locale) : dayjs(sound.captured_at).format('LT');

	let message: string | null = null;

	if (player.failedId === sound.id) {
		message = t('common.sound.playError');
	} else if (shareFailed) {
		message = t('common.sound.shareError');
	}

	async function share() {
		if (!url) {
			return;
		}

		try {
			setShareFailed(false);

			const result = await Share.share({ url, message: url });

			if (result.action === Share.sharedAction) {
				track('mimicry_shared', { session_id: sound.session_id });
			}
		} catch (e) {
			reportError(e, 'mimicry_share');

			setShareFailed(true);
		}
	}

	return (
		<View>
			<PressableSurface
				accessibilityLabel={timeLabel}
				accessibilityHint={url ? t('common.sound.share') : undefined}
				onPress={() => {}}
				onLongPress={url ? () => void share() : undefined}
				disabled={!url}
				variant="plain"
				depth="none"
				cornerRadius="control"
				contentStyle={styles.row}
			>
				{/*녹음 시각과 단어*/}
				<View style={styles.info}>
					<Copy style={styles.time}>{timeLabel}</Copy>
					<Tag variant="primary" label={wordName} />
				</View>

				{/*재생 버튼*/}
				<PlayButton
					playing={playing}
					label={
						url
							? t(playing ? 'common.sound.stop' : 'common.sound.play', {
									time: timeLabel,
								})
							: t('common.sound.expired')
					}
					disabled={!url}
					onPress={() => {
						if (!url) {
							return;
						}

						if (!playing) {
							track('mimicry_played', { session_id: sound.session_id });
						}

						player.toggle(sound.id, url);
					}}
				/>
			</PressableSurface>

			<InlineError message={message} />
		</View>
	);
}

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		minHeight: 60,
		paddingVertical: 8,
		paddingHorizontal: 4,
		borderWidth: 0,
	},
	info: { flex: 1, minWidth: 0, gap: 6 },
	time: {
		fontFamily: font.extraBold,
		fontSize: 14,
		color: colors.text,
		fontVariant: ['tabular-nums'],
	},
});

import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

import { reportError } from "@/services/telemetry/client"

export type SoundPlayer = {
	playingId: string | null
	finishedIds: ReadonlySet<string>
	failedId: string | null
	toggle(id: string, url: string): void
	stop(): void
}

export function useSoundPlayer(): SoundPlayer {
	const player = useAudioPlayer(null, { updateInterval: 100 })
	const status = useAudioPlayerStatus(player)
	const [playingId, setPlayingId] = useState<string | null>(null)
	const [failedId, setFailedId] = useState<string | null>(null)
	const [finishedIds, setFinishedIds] = useState<ReadonlySet<string>>(new Set())
	const request = useRef(0)

	const stop = useCallback(() => {
		request.current++
		player.pause()
		setPlayingId(null)
	}, [player])

	useLayoutEffect(() => stop, [stop])

	useEffect(() => {
		if (!playingId) {
			return
		}

		if (status.playbackState === "failed") {
			setFailedId(playingId)
			stop()
		} else if (status.didJustFinish) {
			const finished = playingId

			setFinishedIds((current) => new Set([...current, finished]))
			stop()
		}
	}, [playingId, status.didJustFinish, status.playbackState, stop])

	const toggle = useCallback(
		(id: string, url: string) => {
			if (playingId === id) {
				stop()

				return
			}

			const token = ++request.current

			player.pause()
			setFailedId(null)

			void setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false })
				.then(async () => {
					if (token !== request.current) {
						return
					}

					player.replace({ uri: url })
					await player.seekTo(0)
					player.play()
					setPlayingId(id)
				})
				.catch((error: unknown) => {
					if (token === request.current) {
						setFailedId(id)
						setPlayingId(null)
						reportError(error, "sound_playback")
					}
				})
		},
		[player, playingId, stop],
	)

	return { playingId, finishedIds, failedId, toggle, stop }
}

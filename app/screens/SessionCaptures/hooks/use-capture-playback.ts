import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

import { inspect } from "@/services/media/inspect"
import { resolveRecordingUri } from "@/services/media/uri"
import { reportError } from "@/services/telemetry/client"
import type  { Capture } from "@/types/capture"

export function useCapturePlayback() {
	const player = useAudioPlayer(null, { updateInterval: 50, keepAudioSessionActive: true })
	const status = useAudioPlayerStatus(player)
	const [activeKey, setActiveKey] = useState<string | null>(null)
	const [failed, setFailed] = useState(false)
	const request = useRef(0)
	const loadedUri = useRef<string | null>(null)
	const endAt = useRef<number | null>(null)

	const stop = useCallback(() => {
		request.current++
		player.pause()
		endAt.current = null
		setActiveKey(null)
	}, [player])

	// This stack screen unmounts on exit; stop before Expo releases the shared player.
	useLayoutEffect(() => stop, [stop])

	useEffect(() => {
		if (!activeKey) {
			return
		}

		// React may still hold the status from before the most recent seek.
		const current = player.currentStatus

		if (current.playbackState === "failed") {
			setFailed(true)
			stop()
		} else if (
			(current.duration > 0 && current.currentTime >= current.duration) ||
			(endAt.current !== null && current.currentTime >= endAt.current)
		) {
			stop()
		}
	}, [activeKey, player, status.currentTime, status.didJustFinish, status.playbackState, stop])

	const play = useCallback(
		async (capture: Capture, segmentIndex?: number) => {
			const token = ++request.current

			player.pause()
			setActiveKey(null)
			setFailed(false)
			endAt.current = null

			try {
				if (!(await inspect(capture.uri)).exists) {
					throw new Error("Capture file unavailable")
				}

				if (token !== request.current) {
					return
				}

				await setAudioModeAsync({
					playsInSilentMode: true,
					allowsRecording: false,
					shouldPlayInBackground: false,
					interruptionMode: "doNotMix",
				})

				if (token !== request.current) {
					return
				}

				const uri = resolveRecordingUri(capture.uri)
				const segment =
					segmentIndex === undefined ? undefined : capture.segments[segmentIndex]

				if (loadedUri.current !== uri) {
					player.replace({ uri })
					loadedUri.current = uri
				}

				await player.seekTo(segment ? Math.max(0, segment.startMs - 300) / 1000 : 0, 0, 0)

				if (token !== request.current) {
					return
				}

				endAt.current = segment ? (segment.endMs + 200) / 1000 : null
				player.play()
				setActiveKey(`${capture.id}:${segmentIndex ?? "full"}`)
			} catch (error) {
				if (token === request.current) {
					stop()
					setFailed(true)
					reportError(error, "capture_preview")
				}
			}
		},
		[player, stop],
	)

	return { activeKey, failed, play, stop }
}

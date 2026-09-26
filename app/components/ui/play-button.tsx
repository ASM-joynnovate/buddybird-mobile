import { IconButton } from "@/components/ui/icon-button"

interface Props {
	playing: boolean
	label: string
	onPress(): void
	disabled?: boolean
}

export function PlayButton({ playing, label, onPress, disabled }: Props) {
	return (
		<IconButton
			icon={playing ? "pause" : "play"}
			label={label}
			variant="primary"
			size="small"
			disabled={disabled}
			onPress={onPress}
		/>
	)
}

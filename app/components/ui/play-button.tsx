import { PauseIcon, PlayIcon } from "lucide-react-native"

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
			icon={playing ? PauseIcon : PlayIcon}
			label={label}
			variant="primary"
			size="small"
			disabled={disabled}
			onPress={onPress}
		/>
	)
}

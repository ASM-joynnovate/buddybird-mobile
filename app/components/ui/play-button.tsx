import { PauseIcon, PlayIcon } from 'lucide-react-native';

import { colors } from '@/theme';

import { IconButton } from '@/components/ui/icon-button';

interface Props {
	playing: boolean;
	label: string;
	onPress: () => void;
	disabled?: boolean;
}

export const PlayButton = ({ playing, label, onPress, disabled }: Props) => {
	return (
		<IconButton
			icon={playing ? PauseIcon : PlayIcon}
			iconProps={{ fill: disabled ? colors.subtle : colors.onFilled }}
			label={label}
			variant="primary"
			size="small"
			disabled={disabled}
			onPress={onPress}
		/>
	);
};

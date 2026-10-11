import { PauseIcon, PlayIcon } from 'lucide-react-native';

import { colors } from '@/theme';

import { IconButton } from '@/components/ui/icon-button';

interface Props {
	playing: boolean;
	label: string;
	onPress: () => void;
	disabled?: boolean;
	size?: 'compact' | 'small';
}

export const PlayButton = ({ playing, label, onPress, disabled, size = 'small' }: Props) => {
	return (
		<IconButton
			icon={playing ? PauseIcon : PlayIcon}
			iconProps={{ fill: disabled ? colors.subtle : colors.onFilled }}
			label={label}
			variant="primary"
			size={size}
			disabled={disabled}
			onPress={onPress}
		/>
	);
};

import type { ComponentType } from 'react';

import { Image, StyleSheet } from 'react-native';

import type { SvgProps } from 'react-native-svg';

import type { LogItemKind } from '@/utils/session-log';

import AppearedIcon from '@assets/images/icons/report/events/appeared.svg';
import DisappearedIcon from '@assets/images/icons/report/events/disappeared.svg';
import MimicIcon from '@assets/images/icons/report/events/mimic.svg';
import SoundIcon from '@assets/images/icons/report/events/sound.svg';

const ICON_SIZE = 36;

const distressImage: number = require('@assets/images/icons/report/events/distress.png');

const kindIcons: Record<Exclude<LogItemKind, 'distressCall'>, ComponentType<SvgProps>> = {
	parrot: SoundIcon,
	mimic: MimicIcon,
	parrotDisappeared: DisappearedIcon,
	parrotAppeared: AppearedIcon,
};

interface Props {
	kind: LogItemKind;
}

/**
 * 기록 종류 아이콘 컴포넌트
 * @param kind 기록 종류
 */
const SessionLogKindIcon = ({ kind }: Props) => {
	if (kind === 'distressCall') {
		return <Image accessibilityIgnoresInvertColors source={distressImage} style={styles.icon} />;
	}

	const Icon = kindIcons[kind];

	return <Icon width={ICON_SIZE} height={ICON_SIZE} />;
};

const styles = StyleSheet.create({
	icon: { width: ICON_SIZE, height: ICON_SIZE },
});

export default SessionLogKindIcon;

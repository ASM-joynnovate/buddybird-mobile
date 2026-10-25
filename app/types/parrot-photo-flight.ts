import type { ReactNode } from 'react';

import type { StyleProp, ViewStyle } from 'react-native';

import type { AnimatedStyle } from 'react-native-reanimated';

export interface ParrotPhotoFlightParts {
	photoStyle: StyleProp<AnimatedStyle<ViewStyle>>;
	buttonsStyle: StyleProp<AnimatedStyle<ViewStyle>>;
	sheetStyle: StyleProp<AnimatedStyle<ViewStyle>>;
	flyingPhoto: ReactNode;
	photoLanded: boolean;
}

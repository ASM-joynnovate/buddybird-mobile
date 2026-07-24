// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
export type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'person.circle': 'account-circle',
  'person.fill': 'person',
  'chevron.left.slash.chevron.right': 'code',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'chevron.down': 'keyboard-arrow-down',
  'dumbbell': 'fitness-center',
  'sparkles': 'auto-awesome',
  'plus': 'add',
  'book.fill': 'book',
  'mic': 'mic',
  'bell.fill': 'notifications',
  'pencil': 'edit',
  'trash': 'delete',
  'camera.fill': 'photo-camera',
  'play.fill': 'play-arrow',
  'pause.fill': 'pause',
  'stop.fill': 'stop',
  'xmark': 'close',
  'arrow.right': 'arrow-forward',
  'chevron.compact.right': 'arrow-forward-ios',
  'flame.fill': 'local-fire-department',
  'clock.fill': 'schedule',
  'lock.fill': 'lock',
  'crown.fill': 'emoji-events',
  'bolt.fill': 'bolt',
  'checkmark': 'check',
  'checkmark.circle.fill': 'check-circle',
  'speaker.wave.2.fill': 'volume-up',
} as const satisfies Partial<IconMapping>;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}

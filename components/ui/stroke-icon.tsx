import { Path, Svg } from 'react-native-svg';

type StrokeIconName = 'check' | 'chevronDown';

interface StrokeIconProps {
  name: StrokeIconName;
  color: string;
  size?: number;
  strokeWidth?: number;
}

const PATHS: Record<StrokeIconName, string> = {
  check: 'M5 12.5 9.2 16.7 19 7.3',
  chevronDown: 'M6 9 12 15 18 9',
};

export function StrokeIcon({ name, color, size = 16, strokeWidth = 3 }: StrokeIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={PATHS[name]}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

import Svg, { Circle, Path, Rect } from "react-native-svg"

import { colors } from "@/theme"

export type IconName =
  | "plus"
  | "back"
  | "play"
  | "pause"
  | "stop"
  | "check"
  | "mic"
  | "trash"
  | "volume"
  | "learn"
  | "book"
  | "profile"
  | "clock"
  | "flame"
  | "lock"
  | "send"

export function Icon({
  name,
  size = 24,
  color = colors.text,
}: {
  name: IconName
  size?: number
  color?: string
}) {
  const paths: Partial<Record<IconName, string>> = {
    plus: "M12 4v16M4 12h16",
    back: "m15 5-7 7 7 7",
    check: "m5 12 4 4L19 6",
    trash: "M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7",
    volume: "m3 9 5 0 5-5v16l-5-5H3zM17 8c2 2 2 6 0 8m3-11c4 4 4 10 0 14",
    learn: "M6 5H3v14h3zM21 5h-3v14h3zM6 9h12v6H6M1 9v6m22-6v6",
    book: "M12 5C9 2 5 2 2 3v17c4-1 7-1 10 1m0-16c3-3 7-3 10-2v17c-4-1-7-1-10 1V5",
    send: "m3 11 18-8-8 18-3-8-7-2 7 2L21 3",
    flame:
      "M13 2c2 6-3 6-1 10 2-1 3-3 3-5 4 4 6 7 4 11-3 6-14 5-15-2-1-4 2-8 5-10-1 4 0 6 1 6 0-4 4-5 3-10z",
  }

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {paths[name] ? <Path d={paths[name]} /> : null}
      {name === "play" ? <Path d="m6 3 15 9-15 9z" fill={color} stroke="none" /> : null}
      {name === "pause" ? (
        <>
          <Rect x={5} y={3} width={5} height={18} rx={1} fill={color} stroke="none" />
          <Rect x={14} y={3} width={5} height={18} rx={1} fill={color} stroke="none" />
        </>
      ) : null}
      {name === "stop" ? (
        <Rect x={4} y={4} width={16} height={16} rx={2} fill={color} stroke="none" />
      ) : null}
      {name === "profile" ? (
        <>
          <Circle cx={12} cy={7} r={4} fill={color} stroke="none" />
          <Path d="M3 22v-3a9 9 0 0 1 18 0v3z" fill={color} stroke="none" />
        </>
      ) : null}
      {name === "clock" ? (
        <>
          <Circle cx={12} cy={12} r={10} />
          <Path d="M12 5v7H7" />
        </>
      ) : null}
      {name === "mic" ? (
        <>
          <Rect x={8} y={2} width={8} height={13} rx={4} />
          <Path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" />
        </>
      ) : null}
      {name === "lock" ? (
        <>
          <Rect x={5} y={10} width={14} height={12} rx={2} fill={color} stroke="none" />
          <Path d="M8 10V6a4 4 0 0 1 8 0v4" />
        </>
      ) : null}
    </Svg>
  )
}

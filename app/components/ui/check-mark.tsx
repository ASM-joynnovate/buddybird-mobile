import Svg, { Polyline } from "react-native-svg"

const sizes = {
	small: { side: 14, stroke: 3 },
	medium: { side: 16, stroke: 3.2 },
} as const

interface Props {
	color: string
	size?: keyof typeof sizes
}

export function CheckMark({ color, size = "medium" }: Props) {
	const { side, stroke } = sizes[size]

	return (
		<Svg width={side} height={side} viewBox="0 0 14 14">
			<Polyline
				points="2.5,7.5 5.8,10.5 11.5,3.8"
				fill="none"
				stroke={color}
				strokeWidth={stroke}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	)
}

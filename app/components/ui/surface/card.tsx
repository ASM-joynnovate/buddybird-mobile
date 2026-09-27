import { StyleSheet } from "react-native"

import { Surface, type SurfaceProps } from "@/components/ui/surface/surface"

interface Props extends SurfaceProps {}

export function Card({ contentStyle, ...props }: Props) {
	return <Surface depth="low" {...props} contentStyle={[styles.card, contentStyle]} />
}

const styles = StyleSheet.create({
	card: { padding: 16 },
})

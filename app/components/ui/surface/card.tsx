import { StyleSheet } from "react-native"

import { Surface, type SurfaceProps } from "@/components/ui/surface/surface"

export function Card({ contentStyle, ...props }: SurfaceProps) {
	return <Surface depth={2} {...props} contentStyle={[styles.card, contentStyle]} />
}

const styles = StyleSheet.create({
	card: { padding: 16 },
})

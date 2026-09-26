import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Chip } from "@/components/ui/chip"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { Wheel, WheelRow } from "@/components/ui/wheel"
import { font } from "@/theme"
import type { SleepSettings } from "@/types/apis/settings"

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const MINUTE_STEPS = Array.from({ length: 12 }, (_, index) => index * 5)

type Field = "sleep_at" | "wake_at"

const pad = (value: number) => String(value).padStart(2, "0")

interface Props {
	value: SleepSettings
	onChange(value: SleepSettings): void
}

export function SleepEditor({ value, onChange }: Props) {
	const { t } = useTranslation()

	const [field, setField] = useState<Field>("sleep_at")

	return (
		<View style={styles.editor}>
			<View style={ui.row}>
				{(["sleep_at", "wake_at"] as const).map((item) => (
					<Chip
						key={item}
						label={t(`session.sleep.${item}`)}
						selected={field === item}
						onPress={() => setField(item)}
					/>
				))}
			</View>
			<TimeWheels
				key={field}
				time={value[field]}
				label={t(`session.sleep.${field}`)}
				onChange={(hour, minute) =>
					onChange({ ...value, [field]: `${pad(hour)}:${pad(minute)}:00` })
				}
			/>
		</View>
	)
}

function TimeWheels({
	time,
	label,
	onChange,
}: {
	time: string
	label: string
	onChange(hour: number, minute: number): void
}) {
	const [hour, minute] = time.split(":").map(Number)
	const minutes = MINUTE_STEPS.includes(minute)
		? MINUTE_STEPS
		: [...MINUTE_STEPS, minute].sort((a, b) => a - b)

	return (
		<WheelRow>
			<Wheel
				testID="sleep-hour"
				label={label}
				value={hour}
				values={HOURS}
				onChange={(next) => onChange(next, minute)}
			/>
			<Copy style={styles.colon}>:</Copy>
			<Wheel
				testID="sleep-minute"
				label={label}
				value={minute}
				values={minutes}
				onChange={(next) => onChange(hour, next)}
			/>
		</WheelRow>
	)
}

const styles = StyleSheet.create({
	editor: { gap: 12 },
	colon: { fontFamily: font.black, fontSize: 20 },
})

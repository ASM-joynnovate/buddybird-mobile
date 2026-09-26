import { useTranslation } from "react-i18next"

import { WheelPicker } from "@/components/ui/wheel-picker"

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const MINUTE_STEPS = Array.from({ length: 12 }, (_, index) => index * 5)

const pad = (value: number) => String(value).padStart(2, "0")

interface Props {
	value: string
	label: string
	onChange(value: string): void
}

export function TimePicker({ value, label, onChange }: Props) {
	const { t } = useTranslation()

	const [hour, minute] = value.split(":").map(Number)
	const minutes = MINUTE_STEPS.includes(minute)
		? MINUTE_STEPS
		: [...MINUTE_STEPS, minute].sort((a, b) => a - b)

	return (
		<WheelPicker
			columns={[
				{
					key: "hour",
					label: t("common.time.hourPicker", { label }),
					value: hour,
					values: HOURS,
					unit: t("common.time.hour"),
					onChange: (next) => onChange(`${pad(next)}:${pad(minute)}:00`),
				},
				{
					key: "minute",
					label: t("common.time.minutePicker", { label }),
					value: minute,
					values: minutes,
					unit: t("common.time.minute"),
					onChange: (next) => onChange(`${pad(hour)}:${pad(next)}:00`),
				},
			]}
		/>
	)
}

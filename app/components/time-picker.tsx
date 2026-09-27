import dayjs from "dayjs"
import { useTranslation } from "react-i18next"

import { HOURS, MINUTE_STEPS, WheelPicker } from "@/components/ui/wheel-picker"
import { CLOCK_FORMAT } from "@/types/sleep-settings"

interface Props {
	value: string
	label: string
	onChange(value: string): void
}

export function TimePicker({ value, label, onChange }: Props) {
	const { t } = useTranslation()

	const time = dayjs(value, CLOCK_FORMAT)
	const minutes = MINUTE_STEPS.includes(time.minute())
		? MINUTE_STEPS
		: [...MINUTE_STEPS, time.minute()].sort((a, b) => a - b)

	return (
		<WheelPicker
			columns={[
				{
					key: "hour",
					label: t("common.time.hourPicker", { label }),
					value: time.hour(),
					values: HOURS,
					unit: t("common.time.hour"),
					onChange: (next) => onChange(time.hour(next).format(CLOCK_FORMAT)),
				},
				{
					key: "minute",
					label: t("common.time.minutePicker", { label }),
					value: time.minute(),
					values: minutes,
					unit: t("common.time.minute"),
					onChange: (next) => onChange(time.minute(next).format(CLOCK_FORMAT)),
				},
			]}
		/>
	)
}

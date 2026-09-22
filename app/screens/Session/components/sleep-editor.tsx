import { useMutation, useQuery } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, StyleSheet, View } from "react-native"

import { Chip } from "@/components/ui/chip"
import { InlineError } from "@/components/ui/inline-error"
import { NavRow } from "@/components/ui/rows"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { Wheel, WheelRow } from "@/components/ui/wheel"
import { settingsQueryOptions, updateSleepMutationOptions } from "@/hooks/apis/settings"
import { formatClock } from "@/i18n/format"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors, font } from "@/theme"

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const MINUTE_STEPS = Array.from({ length: 12 }, (_, index) => index * 5)

type Field = "sleep_at" | "wake_at"

const pad = (value: number) => String(value).padStart(2, "0")

export function SleepEditor({ first, disabled }: { first?: boolean; disabled?: boolean }) {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const settings = useQuery(settingsQueryOptions())
	const data = settings.data

	const saving = useMutation(updateSleepMutationOptions())

	const [open, setOpen] = useState(false)
	const [field, setField] = useState<Field>("sleep_at")

	const value = data
		? t("session.sleep.range", {
				sleep: formatClock(data.sleep.sleep_at, locale),
				wake: formatClock(data.sleep.wake_at, locale),
			})
		: undefined

	function change(hour: number, minute: number) {
		if (!data) {
			return
		}

		saving.mutate({
			sleep: { ...data.sleep, [field]: `${pad(hour)}:${pad(minute)}:00` },
			idempotencyKey: randomUUID(),
		})
	}

	return (
		<>
			<NavRow
				first={first}
				icon="moon"
				label={t("session.sleep.label")}
				value={value}
				disabled={disabled || !data}
				trailing={
					saving.isPending ? <ActivityIndicator color={colors.orange} /> : undefined
				}
				onPress={() => setOpen((current) => !current)}
			/>
			{open && data && !disabled ? (
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
						time={data.sleep[field]}
						label={t(`session.sleep.${field}`)}
						onChange={change}
					/>
					<InlineError message={saving.isError ? t("session.sleep.saveError") : null} />
				</View>
			) : null}
		</>
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
	editor: {
		gap: 12,
		padding: 16,
		borderTopWidth: 2,
		borderTopColor: colors.border,
	},
	colon: { fontFamily: font.black, fontSize: 20 },
})

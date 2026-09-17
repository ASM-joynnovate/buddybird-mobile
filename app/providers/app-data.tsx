import { type PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import { useMMKVString } from "react-native-mmkv"
import { SafeAreaView } from "react-native-safe-area-context"

import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/chip"
import { Copy } from "@/components/ui/text"
import { AppContext } from "@/context/app-data"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { initI18n } from "@/i18n"
import { FeedbackProvider } from "@/providers/feedback"
import { importLegacyData } from "@/services/migration/import-legacy-data"
import { decodeData } from "@/services/storage/codec"
import { DATA_KEY, storage } from "@/services/storage/data-store"
import { saveDeviceSetting } from "@/services/storage/device-settings"
import { reportError } from "@/services/telemetry/client"
import { colors } from "@/theme"

export function AppProvider({ children }: PropsWithChildren) {
	const { t } = useTranslation()
	const locale = useDeviceSetting("locale")
	const [serialized] = useMMKVString(DATA_KEY, storage)
	const [running, setRunning] = useState(true)
	const [failure, setFailure] = useState<unknown>(null)
	const migrating = useRef(false)
	const reportedIssues = useRef(new Set<string>())
	const restored = useMemo(() => {
		try {
			return { data: serialized === undefined ? null : decodeData(serialized), error: null }
		} catch (error) {
			return { data: null, error }
		}
	}, [serialized])
	const data = restored.data
	const retry = useCallback(() => {
		if (migrating.current) {
			return
		}

		migrating.current = true
		setRunning(true)
		setFailure(null)
		void importLegacyData()
			.catch((error) => {
				reportError(error, "data_migration")
				setFailure(error)
			})
			.finally(() => {
				migrating.current = false
				setRunning(false)
			})
	}, [])

	useEffect(retry, [retry])
	useEffect(() => {
		void initI18n(locale).catch((error) => {
			reportError(error, "language_restore")
			setFailure(error)
		})
	}, [locale])
	useEffect(() => {
		if (restored.error) {
			reportError(restored.error, "data_restore")
		}

		for (const issue of data?.migration.issues ?? []) {
			const signature = `${issue.key}:${issue.message}`

			if (reportedIssues.current.has(signature)) {
				continue
			}

			reportedIssues.current.add(signature)
			reportError(new Error(issue.message), `data_migration_${issue.key}`)
		}
	}, [restored.error, data?.migration.issues])

	const notice = (
		<SafeAreaView edges={["top"]} style={styles.notice}>
			<Copy accessibilityRole="alert" style={styles.message}>
				{running
					? t("storage.loading")
					: t(data ? "storage.partial" : "storage.unavailable")}
			</Copy>
			{running ? (
				<ActivityIndicator
					color={colors.orange}
					accessibilityLabel={t("storage.loading")}
				/>
			) : (
				<Button testID="migration-retry" label={t("common.retry")} onPress={retry} />
			)}
		</SafeAreaView>
	)

	if (!data) {
		return (
			<View style={styles.unavailable}>
				{notice}
				<View style={styles.languages}>
					{(["ko", "en"] as const).map((value) => (
						<Chip
							key={value}
							label={value === "ko" ? "한국어" : "English"}
							selected={locale === value}
							onPress={() => {
								try {
									saveDeviceSetting("locale", value)
								} catch (error) {
									reportError(error, "change_language")
									setFailure(error)
								}
							}}
						/>
					))}
				</View>
				{failure ? <Copy style={styles.message}>{t("storage.saveError")}</Copy> : null}
			</View>
		)
	}

	return (
		<AppContext.Provider value={data}>
			<FeedbackProvider>
				<View style={styles.content}>
					{!data.migration.complete || failure ? notice : null}
					{children}
				</View>
			</FeedbackProvider>
		</AppContext.Provider>
	)
}

const styles = StyleSheet.create({
	content: { flex: 1 },
	unavailable: { flex: 1, justifyContent: "center", backgroundColor: colors.background },
	notice: { paddingHorizontal: 20, paddingBottom: 12, backgroundColor: colors.background },
	message: { fontSize: 15, lineHeight: 22, paddingVertical: 8 },
	languages: { flexDirection: "row", gap: 12, padding: 20 },
})

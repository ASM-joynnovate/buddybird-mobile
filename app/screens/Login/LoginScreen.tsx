import * as AppleAuthentication from "expo-apple-authentication"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native"

import { Mascot } from "@/components/mascot"
import { Button } from "@/components/ui/button"
import { Screen } from "@/components/ui/screen"
import { Copy, Title } from "@/components/ui/text"
import { LastLoginTag } from "@/screens/Login/components/last-login-tag"
import { OAuthButton } from "@/screens/Login/components/oauth-button"
import { availableLoginProviders } from "@/services/auth/providers"
import { signInWithApple, signInWithOAuth } from "@/services/auth/sign-in"
import { useAccountStore } from "@/stores/account"
import { useAuthStore } from "@/stores/auth"
import { colors, font, providerColors, radius } from "@/theme"
import type { LoginProvider } from "@/types/account"

export function LoginScreen() {
	const { t } = useTranslation()

	const status = useAuthStore((auth) => auth.status)
	const retry = useAuthStore((auth) => auth.retry)

	const recent = useAccountStore((account) => account.lastLogin)

	const [providers, setProviders] = useState<LoginProvider[]>([])
	const [attempt, setAttempt] = useState<{ provider: LoginProvider; pending: boolean } | null>(
		null,
	)

	const busy = useRef(false)

	const completing = status === "completing"
	const disabled = attempt?.pending === true || completing
	const loadingProvider = disabled ? attempt?.provider : undefined
	const recentHint = t("auth.recentHint")

	useEffect(() => {
		let active = true

		void availableLoginProviders().then((list) => {
			if (active) {
				setProviders(list)
			}
		})

		return () => {
			active = false
		}
	}, [])

	async function signIn(provider: LoginProvider) {
		if (busy.current || status !== "signedOut") {
			return
		}

		busy.current = true

		setAttempt({ provider, pending: true })

		try {
			if (provider === "apple") {
				await signInWithApple()
			} else {
				await signInWithOAuth(provider)
			}
		} catch (failure) {
			if (
				provider === "apple" &&
				failure instanceof Error &&
				"code" in failure &&
				(failure.code === "ERR_REQUEST_CANCELED" || failure.code === "ERR_REQUEST_UNKNOWN")
			) {
				// ponytail: UNKNOWN is ambiguous; finer handling needs native error details.
				return
			}

			Alert.alert(t("auth.signInError"))
		} finally {
			busy.current = false

			setAttempt({ provider, pending: false })
		}
	}

	const progressLabel = loadingProvider
		? t(`auth.pending.${loadingProvider}`)
		: completing
			? t("auth.completing")
			: null

	return (
		<View style={styles.root}>
			<Screen contentContainerStyle={styles.screen}>
				<View style={styles.intro}>
					<Mascot size={150} />
					<Title style={styles.product}>{t("entry.login.product")}</Title>
				</View>
				<View style={styles.actions}>
					{status === "error" ? (
						<Button label={t("common.retry")} onPress={retry} variant="secondary" />
					) : (
						<>
							{providers.includes("google") ? (
								<View>
									{recent === "google" ? (
										<LastLoginTag label={t("auth.recent")} />
									) : null}
									<OAuthButton
										provider="google"
										loading={loadingProvider === "google"}
										disabled={disabled}
										hint={recent === "google" ? recentHint : undefined}
										onPress={() => void signIn("google")}
									/>
								</View>
							) : null}
							{providers.includes("kakao") ? (
								<View>
									{recent === "kakao" ? (
										<LastLoginTag label={t("auth.recent")} />
									) : null}
									<OAuthButton
										provider="kakao"
										loading={loadingProvider === "kakao"}
										disabled={disabled}
										hint={recent === "kakao" ? recentHint : undefined}
										onPress={() => void signIn("kakao")}
									/>
								</View>
							) : null}
							{providers.includes("apple") ? (
								<View style={styles.appleButton}>
									{recent === "apple" ? (
										<LastLoginTag label={t("auth.recent")} />
									) : null}
									<AppleAuthentication.AppleAuthenticationButton
										testID="login-apple"
										buttonType={
											AppleAuthentication.AppleAuthenticationButtonType
												.CONTINUE
										}
										buttonStyle={
											AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
										}
										cornerRadius={radius.control}
										style={styles.appleButton}
										accessibilityLabel={t(
											loadingProvider === "apple"
												? "auth.pending.apple"
												: "auth.apple",
										)}
										accessibilityHint={
											recent === "apple" ? recentHint : undefined
										}
										accessibilityState={{
											disabled,
											busy: loadingProvider === "apple",
										}}
										pointerEvents={disabled ? "none" : "auto"}
										onPress={() => void signIn("apple")}
									/>
									{loadingProvider === "apple" ? (
										<ActivityIndicator
											color={colors.onAccent}
											style={styles.appleProgress}
											pointerEvents="none"
											accessible={false}
										/>
									) : null}
								</View>
							) : null}
						</>
					)}
				</View>
			</Screen>
			{progressLabel ? (
				<View
					style={styles.progress}
					accessibilityLiveRegion="polite"
					accessibilityViewIsModal
				>
					<ActivityIndicator color={colors.orange} size="large" />
					<Copy style={styles.progressText}>{progressLabel}</Copy>
				</View>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	root: { flex: 1 },
	screen: { gap: 36 },
	intro: { flexGrow: 1, alignItems: "center", justifyContent: "center", gap: 20 },
	product: { fontSize: 34, lineHeight: 40, textAlign: "center" },
	actions: { gap: 12 },
	appleButton: { width: "100%", height: 56 },
	appleProgress: {
		...StyleSheet.absoluteFill,
		backgroundColor: providerColors.apple.background,
		borderRadius: radius.control,
		borderCurve: "continuous",
	},
	progress: {
		...StyleSheet.absoluteFill,
		backgroundColor: colors.background,
		alignItems: "center",
		justifyContent: "center",
		gap: 16,
	},
	progressText: { fontFamily: font.extraBold, fontSize: 16, textAlign: "center" },
})

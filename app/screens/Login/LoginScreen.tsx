import * as AppleAuthentication from "expo-apple-authentication"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Alert, Image, StyleSheet, View } from "react-native"

import { Button } from "@/components/ui/button"
import { Screen } from "@/components/ui/screen"
import { Copy, Title } from "@/components/ui/text"
import { useAuth } from "@/context/auth"
import { LastLoginTag } from "@/screens/Login/components/last-login-tag"
import { OAuthButton } from "@/screens/Login/components/oauth-button"
import { availableLoginProviders } from "@/services/auth/providers"
import { lastLoginProvider, type LoginProvider } from "@/services/auth/registration"
import { signInWithApple, signInWithOAuth } from "@/services/auth/sign-in"
import { colors, mascot, radius } from "@/theme"

export function LoginScreen() {
	const { t } = useTranslation()
	const { state, retry } = useAuth()
	const [providers, setProviders] = useState<LoginProvider[]>([])
	const [attempt, setAttempt] = useState<{ provider: LoginProvider; pending: boolean } | null>(
		null,
	)
	const busy = useRef(false)
	const completing = state.status === "completing"
	const disabled = attempt?.pending === true || completing
	const loadingProvider = disabled ? attempt?.provider : undefined
	const recent = lastLoginProvider()
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
		if (busy.current || state.status !== "signedOut") {
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

	return (
		<Screen contentContainerStyle={styles.screen}>
			<View style={styles.intro}>
				<Image
					source={mascot}
					style={styles.mascot}
					resizeMode="contain"
					accessible={false}
				/>
				<Title style={styles.center}>{t("auth.title")}</Title>
				<Copy style={styles.description}>{t("auth.description")}</Copy>
			</View>
			<View style={styles.actions}>
				{state.status === "error" ? (
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
										AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
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
									accessibilityHint={recent === "apple" ? recentHint : undefined}
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
						{completing && !attempt ? (
							<View style={styles.progress} accessibilityLiveRegion="polite">
								<ActivityIndicator
									color={colors.brand}
									accessibilityLabel={t("auth.completing")}
								/>
							</View>
						) : null}
					</>
				)}
			</View>
		</Screen>
	)
}

const appleButtonBackground = "#000000"

const styles = StyleSheet.create({
	screen: { gap: 36 },
	intro: { flexGrow: 1, alignItems: "center", justifyContent: "center", gap: 12 },
	mascot: { width: 112, height: 112, marginBottom: 8 },
	center: { textAlign: "center" },
	description: { color: colors.text, fontSize: 16, lineHeight: 24, textAlign: "center" },
	actions: { gap: 12 },
	appleButton: { width: "100%", height: 56 },
	appleProgress: {
		...StyleSheet.absoluteFill,
		backgroundColor: appleButtonBackground,
		borderRadius: radius.control,
		borderCurve: "continuous",
	},
	progress: { paddingVertical: 8 },
})

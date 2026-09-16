import { isAuthRetryableFetchError, type Session } from "@supabase/supabase-js"
import { type PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react"
import { Alert, AppState } from "react-native"

import { clearLoginCredential, completeLogin } from "@/apis/auth"
import { AuthContext, type AuthState } from "@/context/auth"
import i18next from "@/i18n"
import { HttpError, ResponseError } from "@/lib/http"
import { getSupabase } from "@/lib/supabase"
import { clearRegistration, markRegistered, registeredUser } from "@/services/auth/registration"

export function AuthProvider({ children }: PropsWithChildren) {
	const [state, setState] = useState<AuthState>({ status: "loading" })
	const [attempt, setAttempt] = useState(0)

	useEffect(() => {
		let supabase: ReturnType<typeof getSupabase>

		setState({ status: "loading" })

		try {
			supabase = getSupabase()
		} catch {
			Alert.alert(i18next.t("auth.configurationError"))
			setState({ status: "error" })

			return
		}

		let active = true
		let userId: string | null | undefined
		let request: AbortController | undefined
		let receivedEvent = false

		async function acceptSession(session: Session | null) {
			const nextId = session?.user.id ?? null

			if (!active || userId === nextId) {
				return
			}

			userId = nextId
			request?.abort()

			if (!nextId) {
				clearLoginCredential()
				clearRegistration()
				setState({ status: "signedOut" })

				return
			}

			if (registeredUser() === nextId) {
				setState({ status: "signedIn" })

				return
			}

			const controller = new AbortController()

			request = controller
			setState({ status: "completing" })

			try {
				await completeLogin(nextId, controller.signal)

				if (active && !controller.signal.aborted) {
					markRegistered(nextId)
					setState({ status: "signedIn" })
				}
			} catch (error) {
				if (!active || controller.signal.aborted) {
					return
				}

				alertLoginFailure(error)

				if (!(error instanceof HttpError) || error.retryable) {
					userId = undefined
					setState({ status: "signedOut" })

					return
				}

				try {
					await signOut()
				} catch {
					if (active && !controller.signal.aborted) {
						Alert.alert(i18next.t("auth.signOutError"))
						setState({ status: "error" })
					}
				}
			}
		}

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			// getSession below reports restoration errors that INITIAL_SESSION masks as null.
			if (event === "INITIAL_SESSION") {
				return
			}

			receivedEvent = true
			// The callback stays synchronous so SDK calls never hold its auth lock.
			void acceptSession(session)
		})

		void supabase.auth
			.getSession()
			.then(({ data, error }) => {
				if (!active || receivedEvent) {
					return
				}

				if (!error) {
					void acceptSession(data.session)
				} else if (isAuthRetryableFetchError(error) && registeredUser() !== null) {
					setState({ status: "signedIn" })
				} else {
					Alert.alert(i18next.t("auth.restoreError"))
					setState({ status: "error" })
				}
			})
			.catch(() => {
				if (active && !receivedEvent) {
					Alert.alert(i18next.t("auth.restoreError"))
					setState({ status: "error" })
				}
			})

		const refresh = (next: string) => {
			if (next === "active") {
				void supabase.auth.startAutoRefresh()
			} else {
				void supabase.auth.stopAutoRefresh()
			}
		}

		refresh(AppState.currentState)

		const lifecycle = AppState.addEventListener("change", refresh)

		return () => {
			active = false
			request?.abort()
			subscription.unsubscribe()
			lifecycle.remove()
			void supabase.auth.stopAutoRefresh()
		}
	}, [attempt])

	const retry = useCallback(() => setAttempt((value) => value + 1), [])
	const value = useMemo(() => ({ state, retry, signOut }), [state, retry])

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const credentialErrorCodes = new Set([
	"AUTH__PROVIDER_CREDENTIAL_REQUIRED",
	"AUTH__INVALID_PROVIDER_CREDENTIAL",
])

function alertLoginFailure(error: unknown) {
	let key = error instanceof ResponseError ? "auth.responseError" : "auth.backendError"
	let detail: string | undefined

	if (error instanceof HttpError) {
		const code =
			error.body && typeof error.body === "object" && "error_code" in error.body
				? error.body.error_code
				: null

		detail = typeof code === "string" ? code : `HTTP ${error.status}`

		if (error.status === 401) {
			key = "auth.expired"
		} else if (
			error.status === 400 &&
			typeof code === "string" &&
			credentialErrorCodes.has(code)
		) {
			key = "auth.credentialError"
		}
	}

	Alert.alert(i18next.t(key), detail)
}

async function signOut() {
	const { error } = await getSupabase().auth.signOut({ scope: "local" })

	if (error) {
		throw error
	}
}

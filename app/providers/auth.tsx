import type { Session } from "@supabase/supabase-js"
import { type PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react"
import { AppState } from "react-native"

import { completeLogin } from "@/apis/auth"
import { AuthContext, type AuthState } from "@/context/auth"
import i18next from "@/i18n"
import { HttpError, ResponseError } from "@/lib/http"
import { getSupabase } from "@/lib/supabase"

export function AuthProvider({ children }: PropsWithChildren) {
	const [state, setState] = useState<AuthState>({ status: "loading" })
	const [attempt, setAttempt] = useState(0)

	useEffect(() => {
		let supabase: ReturnType<typeof getSupabase>

		setState({ status: "loading" })

		try {
			supabase = getSupabase()
		} catch {
			setState({ status: "error", message: i18next.t("auth.configurationError") })

			return
		}

		let active = true
		let userId: string | null | undefined
		let request: AbortController | undefined
		let receivedEvent = false
		let signedOutMessage: string | undefined

		async function acceptSession(session: Session | null) {
			const nextId = session?.user.id ?? null

			if (!active || userId === nextId) {
				return
			}

			userId = nextId
			request?.abort()

			if (!nextId) {
				setState({ status: "signedOut", message: signedOutMessage })

				return
			}

			const controller = new AbortController()

			signedOutMessage = undefined
			request = controller
			setState({ status: "completing" })

			try {
				const account = await completeLogin(nextId, controller.signal)

				if (active && !controller.signal.aborted) {
					setState({ status: "signedIn", ...account })
				}
			} catch (error) {
				if (!active || controller.signal.aborted) {
					return
				}

				if (error instanceof HttpError && error.status === 401) {
					signedOutMessage = i18next.t("auth.expired")

					try {
						await signOut()
					} catch {
						if (active && !controller.signal.aborted) {
							setState({ status: "error", message: i18next.t("auth.signOutError") })
						}
					}
				} else {
					setState({
						status: "error",
						message: i18next.t(
							error instanceof ResponseError
								? "auth.responseError"
								: "auth.backendError",
						),
					})
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

				if (error) {
					setState({ status: "error", message: i18next.t("auth.restoreError") })
				} else {
					void acceptSession(data.session)
				}
			})
			.catch(() => {
				if (active && !receivedEvent) {
					setState({ status: "error", message: i18next.t("auth.restoreError") })
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

async function signOut() {
	const { error } = await getSupabase().auth.signOut({ scope: "local" })

	if (error) {
		throw error
	}
}

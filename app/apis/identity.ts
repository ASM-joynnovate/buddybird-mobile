import { getAuth, onAuthStateChanged, signInAnonymously } from "@react-native-firebase/auth"

import { coalesceIdentity } from "@/services/identity/coalesce-identity"

export const currentIdentity = () => getAuth().currentUser?.uid ?? null

export const ensureAnonymousIdentity = coalesceIdentity(
	currentIdentity,
	async () => (await signInAnonymously(getAuth())).user.uid,
)

export function subscribeIdentity(listener: (uid: string | null) => void) {
	return onAuthStateChanged(getAuth(), (user) => listener(user?.uid ?? null))
}

import { create } from "zustand"

type ConsentState = {
	agreedIds: readonly string[]
}

type ConsentActions = {
	markAgreed: (id: string) => void
	takeAgreed: () => readonly string[]
}

type ConsentStore = ConsentState & ConsentActions

export const useConsentStore = create<ConsentStore>()((set, get) => ({
	agreedIds: [],

	markAgreed: (id) => {
		set((state) => ({ ...state, agreedIds: [...state.agreedIds, id] }))
	},

	takeAgreed: () => {
		const { agreedIds } = get()

		set((state) => ({ ...state, agreedIds: [] }))

		return agreedIds
	},
}))

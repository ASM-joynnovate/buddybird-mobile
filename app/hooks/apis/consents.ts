import { keepPreviousData, mutationOptions, queryOptions } from "@tanstack/react-query"

import { type ConsentDecision, fetchConsents, saveConsents } from "@/apis/consents"
import { apiKeys } from "@/hooks/apis/keys"
import { queryClient } from "@/lib/query-client"
import type { Locale } from "@/types/locale"

export const consentsQueryOptions = (locale: Locale) =>
	queryOptions({
		queryKey: apiKeys.consents.list(locale),
		queryFn: () => fetchConsents(locale),
		placeholderData: keepPreviousData,
	})

export const saveConsentsMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("users", "me", "consents"),
		mutationFn: ({
			decisions,
			idempotencyKey,
		}: {
			decisions: ConsentDecision[]
			idempotencyKey: string
		}) => saveConsents(decisions, idempotencyKey),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: apiKeys.consents.all() }),
	})

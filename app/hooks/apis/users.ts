import { mutationOptions, queryOptions } from "@tanstack/react-query"

import { deletePhoto, fetchMe, updateMe, uploadPhoto } from "@/apis/users"
import { apiKeys } from "@/hooks/apis/keys"
import { queryClient } from "@/lib/query-client"
import type { UpdateUserRequest } from "@/types/apis/users"

const refresh = () => queryClient.invalidateQueries({ queryKey: apiKeys.me() })

export const meQueryOptions = () => queryOptions({ queryKey: apiKeys.me(), queryFn: fetchMe })

export const updateMeMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("users", "me", "update"),
		mutationFn: (input: UpdateUserRequest) => updateMe(input),
		onSuccess: refresh,
	})

export const uploadPhotoMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("users", "me", "photo", "upload"),
		mutationFn: (uri: string) => uploadPhoto(uri),
		onSuccess: refresh,
	})

export const deletePhotoMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation("users", "me", "photo", "delete"),
		mutationFn: () => deletePhoto(),
		onSuccess: refresh,
	})

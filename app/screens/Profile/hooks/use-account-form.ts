import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import {
	deletePhotoMutationOptions,
	updateMeMutationOptions,
	uploadPhotoMutationOptions,
} from "@/hooks/apis/users"
import { usePhotoPicker } from "@/hooks/use-photo-picker"
import { ApiError } from "@/types/apis/common"
import { NICKNAME_PATTERN, type User } from "@/types/apis/users"
import { saveWithPhoto } from "@/utils/save-with-photo"

export function useAccountForm(
	user: User,
	onSaved: () => void,
): {
	nickname: string
	setNickname(value: string): void
	nicknameError: string | null
	photo: ReturnType<typeof usePhotoPicker>
	busy: boolean
	error: string | null
	save(): void
} {
	const { t } = useTranslation()

	const mutation = useMutation(updateMeMutationOptions())
	const photoUpload = useMutation(uploadPhotoMutationOptions())
	const photoDelete = useMutation(deletePhotoMutationOptions())

	const savedPhotoUrl = user.photo?.url ?? null

	const photo = usePhotoPicker(savedPhotoUrl)

	const [nickname, setNickname] = useState(user.nickname ?? "")
	const [invalid, setInvalid] = useState(false)

	const busy = mutation.isPending || photoUpload.isPending || photoDelete.isPending
	const photoSaveFailed = photoUpload.isError || photoDelete.isError
	const duplicate =
		mutation.error instanceof ApiError && mutation.error.code === "USER__DUPLICATE_NICKNAME"
	let nicknameError: string | null = null

	if (invalid) {
		nicknameError = t("profile.nicknameInvalid")
	} else if (duplicate) {
		nicknameError = t("profile.nicknameTaken")
	}

	function save() {
		const trimmed = nickname.trim()

		if (!NICKNAME_PATTERN.test(trimmed)) {
			setInvalid(true)

			return
		}

		if (busy) {
			return
		}

		saveWithPhoto({
			photoUri: photo.photoUri,
			savedPhotoUrl,
			saveInfo: () => mutation.mutateAsync({ nickname: trimmed }),
			uploadPhoto: (_saved, uri) => photoUpload.mutateAsync(uri),
			deletePhoto: () => photoDelete.mutateAsync(),
			onDone: onSaved,
		}).catch(() => undefined)
	}

	return {
		nickname,
		setNickname: (value) => {
			setNickname(value)
			setInvalid(false)

			mutation.reset()
		},
		nicknameError,
		photo,
		busy,
		error:
			(mutation.isError && !duplicate) || photoSaveFailed ? t("common.saveErrorKept") : null,
		save,
	}
}

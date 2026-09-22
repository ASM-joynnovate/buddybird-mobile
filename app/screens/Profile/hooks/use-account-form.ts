import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import {
	deletePhotoMutationOptions,
	updateMeMutationOptions,
	uploadPhotoMutationOptions,
} from "@/hooks/apis/users"
import { usePhotoPicker } from "@/screens/Entry/hooks/use-photo-picker"
import { ApiError } from "@/types/apis/common"
import type { User } from "@/types/apis/users"

const NICKNAME = /^[\p{Script=Hangul}A-Za-z0-9_ ]{2,20}$/u

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
	const busy = mutation.isPending || photoUpload.isPending || photoDelete.isPending
	const photoSaveFailed = photoUpload.isError || photoDelete.isError

	const savedPhotoUrl = user.photo?.url ?? null
	const photo = usePhotoPicker(savedPhotoUrl)

	const [nickname, setNickname] = useState(user.nickname ?? "")
	const [invalid, setInvalid] = useState(false)
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

		if (!NICKNAME.test(trimmed)) {
			setInvalid(true)

			return
		}

		if (busy) {
			return
		}

		saveAccount(trimmed).catch(() => undefined)
	}

	async function saveAccount(trimmed: string) {
		await mutation.mutateAsync({ nickname: trimmed })

		if (photo.photoUri && photo.photoUri !== savedPhotoUrl) {
			await photoUpload.mutateAsync(photo.photoUri)
		} else if (!photo.photoUri && savedPhotoUrl) {
			await photoDelete.mutateAsync()
		}

		onSaved()
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

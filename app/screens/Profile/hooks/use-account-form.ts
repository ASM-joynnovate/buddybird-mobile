import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import type { User } from "@/apis/users"
import { updateMeMutationOptions } from "@/hooks/apis/users"
import { ApiError } from "@/lib/api"
import { usePhotoPicker } from "@/screens/Entry/hooks/use-photo-picker"

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
	const photo = usePhotoPicker(user.photo_url)
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

		if (mutation.isPending) {
			return
		}

		mutation.mutate({ nickname: trimmed, photo_url: photo.photoUri }, { onSuccess: onSaved })
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
		busy: mutation.isPending,
		error: mutation.isError && !duplicate ? t("common.saveErrorKept") : null,
		save,
	}
}

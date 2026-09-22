import * as ImagePicker from "expo-image-picker"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { type PermissionDialogState, usePermission } from "@/hooks/use-permission"
import { reportError } from "@/services/telemetry/client"

const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const PHOTO_TYPES = ["image/jpeg", "image/png"]

function photoType(asset: ImagePicker.ImagePickerAsset) {
	if (asset.mimeType) {
		return asset.mimeType
	}

	const extension = asset.uri.split(".").pop()?.toLowerCase()

	return extension === "png"
		? "image/png"
		: extension === "jpg" || extension === "jpeg"
			? "image/jpeg"
			: ""
}

export function usePhotoPicker(initial: string | null): {
	photoUri: string | null
	setPhotoUri(uri: string | null): void
	choose(): Promise<void>
	error: string | null
	dialog: PermissionDialogState
} {
	const { t } = useTranslation()
	const permission = usePermission("photos")
	const [photoUri, setPhotoUri] = useState(initial)
	const [error, setError] = useState<string | null>(null)

	async function pick() {
		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ["images"],
				allowsEditing: true,
				quality: 0.85,
			})

			if (result.canceled) {
				return
			}

			const asset = result.assets[0]

			if (!PHOTO_TYPES.includes(photoType(asset))) {
				setError(t("entry.parrot.photoType"))
			} else if ((asset.fileSize ?? 0) > MAX_PHOTO_BYTES) {
				setError(t("entry.parrot.photoSize"))
			} else {
				setPhotoUri(asset.uri)
				setError(null)
			}
		} catch (cause) {
			reportError(cause, "photo_picker")
			setError(t("entry.parrot.photoError"))
		}
	}

	async function choose() {
		try {
			await permission.run(() => void pick())
		} catch (cause) {
			reportError(cause, "photo_permission")
			setError(t("entry.parrot.photoError"))
		}
	}

	return {
		photoUri,
		setPhotoUri: (uri) => {
			setPhotoUri(uri)
			setError(null)
		},
		choose,
		error,
		dialog: permission.dialog,
	}
}

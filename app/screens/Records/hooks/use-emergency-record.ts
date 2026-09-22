import { useMutation, useQuery, type UseQueryResult } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import { useEffect, useRef, useState } from "react"
import { Share } from "react-native"

import type { Emergency } from "@/apis/emergencies"
import {
	confirmEmergencyMutationOptions,
	deleteEmergencyMutationOptions,
	emergencyQueryOptions,
	isDeletedRecord,
} from "@/hooks/apis/emergencies"

export type EmergencyRecord = {
	query: UseQueryResult<Emergency>
	deleted: boolean
	deleteOpen: boolean
	openDelete(): void
	closeDelete(): void
	deleting: boolean
	deleteFailed: boolean
	confirmDelete(onDone: () => void): void
	downloadFailed: boolean
	download(): Promise<void>
}

export function useEmergencyRecord(emergencyId: string): EmergencyRecord {
	const query = useQuery(emergencyQueryOptions(emergencyId))
	const confirm = useMutation(confirmEmergencyMutationOptions())
	const remove = useMutation(deleteEmergencyMutationOptions())
	const [deleteOpen, setDeleteOpen] = useState(false)
	const [downloadFailed, setDownloadFailed] = useState(false)
	const confirmed = useRef(false)
	const unconfirmed = query.data?.is_confirmed === false
	const { mutate: saveConfirm } = confirm

	useEffect(() => {
		if (!unconfirmed || confirmed.current) {
			return
		}

		confirmed.current = true
		saveConfirm({ id: emergencyId, idempotencyKey: randomUUID() })
	}, [emergencyId, saveConfirm, unconfirmed])

	async function download() {
		const url = query.data?.media?.url

		if (!url) {
			return
		}

		try {
			setDownloadFailed(false)
			await Share.share({ url, message: url })
		} catch {
			setDownloadFailed(true)
		}
	}

	return {
		query,
		deleted: isDeletedRecord(query.error),
		deleteOpen,
		openDelete: () => {
			remove.reset()
			setDeleteOpen(true)
		},
		closeDelete: () => setDeleteOpen(false),
		deleting: remove.isPending,
		deleteFailed: remove.isError,
		confirmDelete: (onDone) =>
			remove.mutate(
				{ id: emergencyId, idempotencyKey: randomUUID() },
				{
					onSuccess: () => {
						setDeleteOpen(false)
						onDone()
					},
				},
			),
		downloadFailed,
		download,
	}
}

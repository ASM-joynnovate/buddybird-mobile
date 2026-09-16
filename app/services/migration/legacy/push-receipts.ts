import { AppData } from "@/types/app-data"
import {
	readNullableText,
	requireChoice,
	requireList,
	requireNonnegativeNumber,
	requireRecord,
	requireText,
} from "@/utils/validation"

export function applyLegacyReceipts(data: AppData, receipts: unknown) {
	if (receipts !== undefined) {
		const incoming = requireList(receipts, "receipts").map((value) => {
			const receiptRecord = requireRecord(value, "receipt")

			return {
				messageId: readNullableText(receiptRecord.messageId, "messageId"),
				from: readNullableText(receiptRecord.from, "from"),
				sentTime:
					receiptRecord.sentTime === null
						? null
						: requireNonnegativeNumber(receiptRecord.sentTime, "sentTime"),
				source: requireChoice(
					receiptRecord.source,
					["foreground", "background", "notification_opened"] as const,
					"receipt.source",
				),
				receivedAt: requireText(receiptRecord.receivedAt, "receivedAt"),
			}
		})

		data.settings.receipts = [...incoming, ...data.settings.receipts]
	}
}

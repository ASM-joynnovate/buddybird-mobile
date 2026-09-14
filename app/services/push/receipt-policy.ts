export function newestReceipts(receipts: import("@/types/push").PushReceipt[]) {
	const unique = new Map(receipts.map((receipt) => [JSON.stringify(receipt), receipt]))

	return [...unique.values()]
		.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
		.slice(0, 20)
}

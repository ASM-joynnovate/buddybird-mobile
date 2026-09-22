import { mockServer } from "@/mocks/server"
import { type AppUpdate, appUpdateSchema } from "@/mocks/types"

export async function fetchAppUpdate(): Promise<AppUpdate> {
	return appUpdateSchema.parse(await mockServer.appUpdate.get())
}

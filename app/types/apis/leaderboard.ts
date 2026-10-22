import { communityUserSchema } from '@/types/apis/users';

import { z } from 'zod';

const leaderboardItemSchema = z.object({
	rank: z.number().int(),
	score: z.number(),
	user: communityUserSchema,
});

export const leaderboardSchema = z.object({
	items: z.array(leaderboardItemSchema),
	me: z.object({
		rank: z.number().int().nullable(),
		unranked_reason: z.string().nullable(),
		score: z.number(),
	}),
});

export type Leaderboard = z.infer<typeof leaderboardSchema>;
export type LeaderboardItem = z.infer<typeof leaderboardItemSchema>;

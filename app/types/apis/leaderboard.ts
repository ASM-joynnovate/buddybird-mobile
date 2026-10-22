import { communityUserSchema } from '@/types/apis/users';

import { z } from 'zod';

const unrankedReasons = ['not_participating', 'no_nickname', 'anonymous', 'country_mismatch', 'no_record'] as const;

const leaderboardItemSchema = z.object({
	rank: z.number().int(),
	score: z.number(),
	user: communityUserSchema,
});

export const leaderboardSchema = z.object({
	items: z.array(leaderboardItemSchema),
	me: z.object({
		rank: z.number().int().nullable(),
		unranked_reason: z.enum(unrankedReasons).nullable().catch(null),
		score: z.number(),
	}),
});

export type Leaderboard = z.infer<typeof leaderboardSchema>;
export type LeaderboardItem = z.infer<typeof leaderboardItemSchema>;
export type UnrankedReason = (typeof unrankedReasons)[number];

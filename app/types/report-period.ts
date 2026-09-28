import { z } from 'zod';

export const reportPeriodSchema = z.enum(['day', 'week', 'month']);

export type ReportPeriod = z.infer<typeof reportPeriodSchema>;

export type ReportPeriodSelection = { period: ReportPeriod; start: string };

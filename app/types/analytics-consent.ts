export const analyticsConsents = ['unknown', 'granted', 'denied', 'not_applicable'] as const;

export type AnalyticsConsent = (typeof analyticsConsents)[number];

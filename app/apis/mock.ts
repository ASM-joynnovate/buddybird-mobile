import type { MockLocale } from '@/mocks/seed';
import { mockServer } from '@/mocks/server';

export const mockPutLocale = ({ locale }: { locale: () => MockLocale }): void => {
	mockServer.configure(locale);
};

import { z } from 'zod';

export const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const timestampSchema = z.iso.datetime({ offset: true });
export const uuidSchema = z.uuid();

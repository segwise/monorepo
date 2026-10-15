import type z from 'zod';
import type { SchemaQuotePrint } from '../../schemas/quotes';

type QuotePrint = z.infer<typeof SchemaQuotePrint>;

export type { QuotePrint };

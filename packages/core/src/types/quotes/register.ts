import type z from 'zod';
import type { SchemaQuoteRegister } from '@/schemas/quotes/register';

type QuoteRegister = z.infer<typeof SchemaQuoteRegister>;

export type { QuoteRegister };

import type z from 'zod';
import type {
	SchemaQuoteRegister,
	SchemaQuoteSimpleRegister,
} from '@/schemas/quotes/register';

type QuoteRegister = z.infer<typeof SchemaQuoteRegister>;

type QuoteSimpleRegister = z.infer<typeof SchemaQuoteSimpleRegister>;

export type { QuoteRegister, QuoteSimpleRegister };

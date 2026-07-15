import type z from 'zod';
import type {
	SchemaQuoteRegister,
	SchemaQuoteSimpleCustomRegister,
	SchemaQuoteSimpleRegister,
} from '../../schemas/quotes';

type QuoteRegister = z.infer<typeof SchemaQuoteRegister>;

type QuoteSimpleRegister = z.infer<typeof SchemaQuoteSimpleRegister>;

type QuoteSimpleCustomRegister = z.infer<
	typeof SchemaQuoteSimpleCustomRegister
>;

export type { QuoteRegister, QuoteSimpleRegister, QuoteSimpleCustomRegister };

import type z from 'zod';

import type { SchemaQuoteFinancingRegister } from '../../schemas/financing/register';

type QuoteFinancingRegister = z.infer<typeof SchemaQuoteFinancingRegister>;

export type { QuoteFinancingRegister };

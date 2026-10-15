import type z from 'zod';
import type { SchemaSearchParamsQuoteSimple } from '../../../schemas/search-params';

type SearchParamsQuoteSimpleProps = z.infer<
	typeof SchemaSearchParamsQuoteSimple
>;

export type { SearchParamsQuoteSimpleProps };

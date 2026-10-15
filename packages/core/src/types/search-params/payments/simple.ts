import type z from 'zod';
import type { SchemaSearchParamsPaymentSimple } from '../../../schemas/search-params';

type SearchParamsPaymentSimpleProps = z.infer<
	typeof SchemaSearchParamsPaymentSimple
>;

export type { SearchParamsPaymentSimpleProps };

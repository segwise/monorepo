import type z from 'zod';
import type { SchemaSearchParamsProducerSimple } from '../../../schemas/search-params';

type SearchParamsProducerSimpleProps = z.infer<
	typeof SchemaSearchParamsProducerSimple
>;

export type { SearchParamsProducerSimpleProps };

import type z from 'zod';
import type { SchemaSearchParamsMarketplaceSimple } from '../../../schemas/search-params';

type SearchParamsMarketplaceSimpleProps = z.infer<
	typeof SchemaSearchParamsMarketplaceSimple
>;

export type { SearchParamsMarketplaceSimpleProps };

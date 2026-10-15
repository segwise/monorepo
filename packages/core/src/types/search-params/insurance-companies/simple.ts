import type z from 'zod';
import type { SchemaSearchParamsInsuranceCompanySimple } from '../../../schemas/search-params';

type SearchParamsInsuranceCompanySimpleProps = z.infer<
	typeof SchemaSearchParamsInsuranceCompanySimple
>;

export type { SearchParamsInsuranceCompanySimpleProps };

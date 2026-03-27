import {
	SchemaQuoteStatus,
	SchemaQuoteType,
	SchemaSearchParamsQuoteSimple,
} from '@segwise/core/schemas';
import {
	parseAsArrayOf,
	parseAsInteger,
	parseAsJson,
	parseAsString,
	parseAsStringEnum,
	useQueryStates,
} from 'nuqs';

const useSearchParams = () =>
	useQueryStates({
		cursor: parseAsString,
		search: parseAsString,
		producer: parseAsArrayOf(parseAsString),
		insuranceCompanies: parseAsArrayOf(parseAsString),
		requestAt: parseAsJson(SchemaSearchParamsQuoteSimple.shape.requestAt),
		type: parseAsStringEnum(SchemaQuoteType.options),
		status: parseAsStringEnum(SchemaQuoteStatus.options),
		limit: parseAsInteger.withDefault(
			SchemaSearchParamsQuoteSimple.shape.limit._zod.def.defaultValue || 10,
		),
	});

type SearchParamsProps = ReturnType<typeof useSearchParams>[0];

export { useSearchParams, type SearchParamsProps };

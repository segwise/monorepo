import {
	SchemaModality,
	SchemaQuoteStatus,
	SchemaQuoteType,
	SchemaSearchParamsQuoteSimple,
} from '@segwise/core/schemas';
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from 'date-fns';
import {
	parseAsArrayOf,
	parseAsBoolean,
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
		producers: parseAsArrayOf(parseAsString),
		insuranceCompanies: parseAsArrayOf(parseAsString),
		requestAt: parseAsJson(
			SchemaSearchParamsQuoteSimple.shape.requestAt,
		).withDefault({
			start: startOfMonth(startOfDay(new Date())).toISOString(),
			end: endOfMonth(endOfDay(new Date())).toISOString(),
		}),
		type: parseAsArrayOf(parseAsStringEnum(SchemaQuoteType.options)),
		status: parseAsArrayOf(parseAsStringEnum(SchemaQuoteStatus.options)),
		limit: parseAsInteger.withDefault(
			SchemaSearchParamsQuoteSimple.shape.limit._zod.def.defaultValue || 10,
		),
		renewal: parseAsBoolean,
		modality: parseAsArrayOf(parseAsStringEnum(SchemaModality.options)),
	});

type SearchParamsProps = ReturnType<typeof useSearchParams>[0];

export { useSearchParams, type SearchParamsProps };

import {
	SchemaModality,
	SchemaQuoteStatus,
	SchemaQuoteType,
	SchemaSearchParamsQuoteSimple,
} from '@segwise/core/schemas';
import { endOfToday, startOfMonth, startOfToday } from 'date-fns';
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
			start: startOfMonth(startOfToday()).toISOString(),
			end: endOfToday().toISOString(),
		}),
		type: parseAsArrayOf(parseAsStringEnum(SchemaQuoteType.options)),
		status: parseAsArrayOf(parseAsStringEnum(SchemaQuoteStatus.options)),
		limit: parseAsInteger.withDefault(
			SchemaSearchParamsQuoteSimple.shape.limit._zod.def.defaultValue || 10,
		),
		renewal: parseAsBoolean,
		modality: parseAsArrayOf(parseAsStringEnum(SchemaModality.options)),
		basisOfAnalysis: parseAsStringEnum(['year', 'month']).withDefault('year'),
	});

type SearchParamsProps = ReturnType<typeof useSearchParams>[0];

export { useSearchParams, type SearchParamsProps };

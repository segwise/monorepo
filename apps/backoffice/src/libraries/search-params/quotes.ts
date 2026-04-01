import {
	SchemaBasisOfAnalysis,
	SchemaModality,
	SchemaQuoteStatus,
	SchemaSearchParamsQuoteSimple,
} from '@segwise/core/schemas';
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
		producers: parseAsArrayOf(parseAsString).withDefault([]).withOptions({
			clearOnDefault: true,
		}),
		insuranceCompanies: parseAsArrayOf(parseAsString)
			.withDefault([])
			.withOptions({
				clearOnDefault: true,
			}),
		requestAt: parseAsJson(SchemaSearchParamsQuoteSimple.shape.requestAt),
		status: parseAsArrayOf(parseAsStringEnum(SchemaQuoteStatus.options))
			.withDefault([])
			.withOptions({
				clearOnDefault: true,
			}),
		limit: parseAsInteger,
		renewal: parseAsBoolean,
		modality: parseAsArrayOf(parseAsStringEnum(SchemaModality.options))
			.withDefault([])
			.withOptions({
				clearOnDefault: true,
			}),
		basisOfAnalysis: parseAsStringEnum(SchemaBasisOfAnalysis.options),
	});

type SearchParamsProps = ReturnType<typeof useSearchParams>[0];

export { useSearchParams, type SearchParamsProps };

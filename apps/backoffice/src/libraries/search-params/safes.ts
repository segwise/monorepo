import {
	SchemaBasisOfAnalysis,
	SchemaModality,
	SchemaSafeStatus,
	SchemaSearchParamsSafeSimple,
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
		producers: parseAsArrayOf(parseAsString),
		insuranceCompanies: parseAsArrayOf(parseAsString),
		effectivedAt: parseAsJson(SchemaSearchParamsSafeSimple.shape.effectivedAt),
		effectived: parseAsBoolean,
		status: parseAsArrayOf(parseAsStringEnum(SchemaSafeStatus.options)),
		limit: parseAsInteger,
		renewal: parseAsBoolean,
		modality: parseAsArrayOf(parseAsStringEnum(SchemaModality.options)),
		basisOfAnalysis: parseAsStringEnum(SchemaBasisOfAnalysis.options),
	});

type SearchParamsProps = ReturnType<typeof useSearchParams>[0];

export { useSearchParams, type SearchParamsProps };

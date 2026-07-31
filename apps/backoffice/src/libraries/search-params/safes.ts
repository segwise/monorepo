import {
	SchemaBasisOfAnalysis,
	SchemaModality,
	SchemaSafeStatus,
	SchemaSearchParamsSafeSimple,
} from '@segwise/core/schemas';
import { endOfMonth, isSameDay, startOfToday } from 'date-fns';
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
		effectived: parseAsBoolean,
		effectivedAt: parseAsJson(
			SchemaSearchParamsSafeSimple.shape.effectivedAt,
		).withDefault(
			isSameDay(startOfToday(), endOfMonth(startOfToday()))
				? startOfToday()
				: {
						start: startOfToday(),
						end: endOfMonth(startOfToday()),
					},
		),
		status: parseAsArrayOf(parseAsStringEnum(SchemaSafeStatus.options))
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

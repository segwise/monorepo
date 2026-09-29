import {
	parseAsInteger,
	parseAsString,
	parseAsStringEnum,
	useQueryStates,
} from 'nuqs';

const useSearchParams = () =>
	useQueryStates({
		cursor: parseAsString,
		search: parseAsString,
		limit: parseAsInteger,
		status: parseAsStringEnum(['active', 'pending'] as const),
		kind: parseAsStringEnum(['all', 'partner', 'producer'] as const),
	});

type SearchParamsProps = ReturnType<typeof useSearchParams>[0];

export { useSearchParams, type SearchParamsProps };

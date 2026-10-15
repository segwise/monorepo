import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

const useSearchParams = () =>
	useQueryStates({
		cursor: parseAsString,
		search: parseAsString,
		limit: parseAsInteger,
	});

type SearchParamsProps = ReturnType<typeof useSearchParams>[0];

export { type SearchParamsProps, useSearchParams };

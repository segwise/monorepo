import type {
	ResponseDataCursor,
	SafeDetails,
	SafeSimple,
} from '@segwise/core/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';
import type { SearchParamsProps } from '@/libraries/search-params/safes';

const useSafesSimple = ({
	effectived,
	...props
}: Omit<SearchParamsProps, 'basisOfAnalysis'>) =>
	useQuery({
		queryKey: effectived
			? ['policies', 'simple', props]
			: ['proposals', 'simple', props],
		queryFn: async ({ signal }) =>
			(
				await api.get<ResponseDataCursor<SafeSimple>>('/safes/simple', {
					params: {
						...props,
						effectived,
						isExternal: false,
					},
					signal,
				})
			).data,
	});

const useSafesById = (id?: string) =>
	useQuery({
		queryKey: ['safe', id],
		queryFn: async ({ signal }) =>
			(
				await api.get<SafeDetails>(`/safes/${id}`, {
					signal,
				})
			).data,
		enabled: !!id,
	});

export { useSafesSimple, useSafesById };

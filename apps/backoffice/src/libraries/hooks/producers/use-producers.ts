import type {
	ProducerListItem,
	ProducerSimple,
	ResponseDataCursor,
} from '@segwise/core/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';
import type { SearchParamsProps } from '@/libraries/search-params/producers';

type UseProducersSimpleProps = {
	enabled?: boolean;
};

const useProducersSimpleFull = ({ enabled }: UseProducersSimpleProps = {}) =>
	useQuery({
		queryKey: ['producers', 'simple', 'full'],
		queryFn: async ({ signal }) =>
			(
				await api.get<Array<ProducerSimple>>('/producers/simple/full', {
					signal,
				})
			).data,
		enabled,
	});

const useProducersSimple = (
	props: Partial<SearchParamsProps> = {},
	{ enabled = true }: UseProducersSimpleProps = {},
) =>
	useQuery({
		queryKey: ['producers', 'simple', props],
		queryFn: async ({ signal }) =>
			(
				await api.get<ResponseDataCursor<ProducerListItem>>(
					'/producers/simple',
					{
						params: props,
						signal,
					},
				)
			).data,
		enabled,
	});

export { useProducersSimple, useProducersSimpleFull };

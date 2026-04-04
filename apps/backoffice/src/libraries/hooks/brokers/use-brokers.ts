import type { BrokerSimple } from '@segwise/core/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';
import type { SearchParamsProps } from '@/libraries/search-params/brokers';

type UseBrokersProps = {
	enabled?: boolean;
};

const useBrokersSimple = (
	props: Partial<SearchParamsProps> = {},
	{ enabled = true }: UseBrokersProps = {},
) =>
	useQuery({
		queryKey: ['brokers', 'simple', props],
		queryFn: async ({ signal }) =>
			(
				await api.get<Array<BrokerSimple>>('/brokers/simple', {
					params: props,
					signal,
				})
			).data,
		enabled,
	});

export { useBrokersSimple };

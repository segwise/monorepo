import type { BrokerPublic } from '@segwise/core/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useBrokerPublic = (slug: string) =>
	useQuery({
		queryKey: ['brokers', 'public', slug],
		queryFn: async ({ signal }) =>
			(await api.get<BrokerPublic>(`/producers/public/${slug}`, { signal }))
				.data,
		retry: false,
	});

export { useBrokerPublic };

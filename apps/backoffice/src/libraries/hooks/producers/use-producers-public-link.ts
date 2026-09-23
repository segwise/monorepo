import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useProducersPublicLink = () =>
	useQuery({
		queryKey: ['producers', 'public-link'],
		queryFn: async ({ signal }) =>
			(await api.get<{ url: string }>('/producers/public-link', { signal }))
				.data,
	});

export { useProducersPublicLink };

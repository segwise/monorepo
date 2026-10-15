import { fetchApi } from '@/functions/api';
import { useQuery } from '@tanstack/react-query';

const useMarketplaceCities = (state: string | null) =>
	useQuery({
		queryKey: ['marketplace', 'cities', state],
		queryFn: async () =>
			state ? await fetchApi.marketplace.cities(state) : undefined,
		enabled: !!state,
	});

export { useMarketplaceCities };

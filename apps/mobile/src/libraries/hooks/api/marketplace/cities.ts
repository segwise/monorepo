import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/functions/api';

const useMarketplaceCities = (state: string | null) =>
	useQuery({
		queryKey: ['marketplace', 'cities', state],
		queryFn: async () =>
			state ? await fetchApi.marketplace.cities(state) : undefined,
		enabled: !!state,
	});

export { useMarketplaceCities };

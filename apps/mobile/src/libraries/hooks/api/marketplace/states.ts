import { fetchApi } from '@/functions/api';
import { useQuery } from '@tanstack/react-query';

const useMarketplaceStates = () =>
	useQuery({
		queryKey: ['marketplace', 'states'],
		queryFn: fetchApi.marketplace.states,
	});

export { useMarketplaceStates };

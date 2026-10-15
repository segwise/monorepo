import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/functions/api';

const useMarketplaceStates = () =>
	useQuery({
		queryKey: ['marketplace', 'states'],
		queryFn: fetchApi.marketplace.states,
	});

export { useMarketplaceStates };

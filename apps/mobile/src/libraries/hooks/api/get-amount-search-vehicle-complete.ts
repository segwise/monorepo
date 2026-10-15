import { api } from '@/libraries/api';
import { useQuery } from '@tanstack/react-query';

const useGetAmountSearchVehicleComplete = () =>
	useQuery({
		queryKey: ['get-amount-search-vehicle', 'complete'],
		queryFn: async ({ signal }) =>
			(
				await api.get<{
					amount: number;
				}>('/pix/get-amount', {
					signal,
				})
			).data,
	});

export { useGetAmountSearchVehicleComplete };

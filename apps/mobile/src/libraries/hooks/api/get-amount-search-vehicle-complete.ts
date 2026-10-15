import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

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

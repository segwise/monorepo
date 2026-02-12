import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useVehiclesManufacturers = () =>
	useQuery({
		queryKey: ['vehicles', 'manufacturers'],
		queryFn: async ({ signal }) =>
			(
				await api.get<
					Array<{
						name: string;
						image: string;
					}>
				>('/vehicles/manufacturers', {
					signal,
				})
			).data,
	});

export { useVehiclesManufacturers };

import type { VehicleManufacturer } from '@segwise/core/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useVehiclesManufacturers = () =>
	useQuery({
		queryKey: ['vehicles', 'manufacturers'],
		queryFn: async ({ signal }) =>
			(
				await api.get<Array<VehicleManufacturer>>('/vehicles/manufacturers', {
					signal,
				})
			).data,
	});

export { useVehiclesManufacturers };

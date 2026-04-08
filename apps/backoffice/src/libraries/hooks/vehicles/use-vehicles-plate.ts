import type { Vehicle } from '@segwise/core/types';
import { isPlate } from '@segwise/core/valids';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useVehiclesPlate = (plate?: string | '') =>
	useQuery({
		queryKey: ['vehicles', 'plate', plate],
		queryFn: async ({ signal }) =>
			(
				await api.get<Vehicle>(
					`/vehicles/${plate?.replace('-', '').toLowerCase()}`,
					{
						signal,
					},
				)
			).data,
		enabled: isPlate(plate || ''),
	});

export { useVehiclesPlate };

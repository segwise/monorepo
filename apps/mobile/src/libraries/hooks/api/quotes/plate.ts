import { SchemaPlate } from '@segwise/core/schemas';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/functions/api';

const useQuoteIsPlate = (plate: string) =>
	useQuery({
		queryKey: ['quote', 'isPlate', plate],
		queryFn: async ({ signal }) => {
			const response = await fetchApi.safes
				.isPlate(plate, {
					signal,
				})
				.catch(() => null);

			return response;
		},
		retry: 0,
		enabled: SchemaPlate.safeParse(plate).success,
	});

export { useQuoteIsPlate };

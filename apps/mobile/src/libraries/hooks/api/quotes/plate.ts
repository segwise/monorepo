import { fetchApi } from '@/functions/api';
import { SchemaPlate } from '@segwise/core/schemas';
import { useQuery } from '@tanstack/react-query';

const useQuoteIsPlate = (plate: string) =>
	useQuery({
		queryKey: ['quote', 'isPlate', plate],
		queryFn: async ({ signal }) =>
			await fetchApi.quotes.isPlate(plate, {
				signal,
			}),
		retry: 0,
		enabled: SchemaPlate.safeParse(plate).success,
	});

export { useQuoteIsPlate };

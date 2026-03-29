import type { ProducerSimple } from '@segwise/core/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

type UseProducersSimpleProps = {
	enabled: boolean;
};

const useProducersSimple = ({
	enabled,
}: Partial<UseProducersSimpleProps> = {}) =>
	useQuery({
		queryKey: ['producers', 'simple'],
		queryFn: async ({ signal }) =>
			(
				await api.get<Array<ProducerSimple>>('/producers/simple', {
					signal,
				})
			).data,
		enabled,
	});

export { useProducersSimple };

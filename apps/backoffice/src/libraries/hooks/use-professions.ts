import type { ProfessionSimple } from '@segwise/core/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

type UseProfessionsSimpleProps = {
	enabled: boolean;
};

const useProfessionsSimple = ({
	enabled,
}: Partial<UseProfessionsSimpleProps> = {}) =>
	useQuery({
		queryKey: ['professions', 'simple'],
		queryFn: async ({ signal }) =>
			await api
				.get<Array<ProfessionSimple>>('/professions/simple', {
					signal,
				})
				.then(({ data }) => data),
		enabled,
	});

export { useProfessionsSimple };

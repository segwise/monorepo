import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useProfessions = ({ simple }: { simple?: boolean } = {}) =>
	useQuery({
		queryKey: [
			'professions',
			{
				simple,
			},
		],
		queryFn: async ({ signal }) =>
			await api
				.get<Array<{ code: string; name: string }>>(
					!simple ? '/professions' : '/professions/simple',
					{
						signal,
					},
				)
				.then(({ data }) => data),
	});

export { useProfessions };

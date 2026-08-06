import type { Endorsement } from '@segwise/core';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

const useEndorsements = (id: string, enabled?: boolean) =>
	useQuery({
		queryKey: ['endorsements', id],
		queryFn: async ({ signal }) => {
			const { data } = await api.get<Array<Endorsement>>(
				`/endorsements/${id}`,
				{
					signal,
				},
			);

			return data;
		},
		enabled,
	});

export { useEndorsements };

import type { Endorsement } from '@segwise/core';
import { useMutation, useQuery } from '@tanstack/react-query';
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

const useEndorsementCancel = () =>
	useMutation<
		{
			message: string;
		},
		Error,
		{
			id: string;
		}
	>({
		mutationKey: ['endorsements', 'cancel'],
		mutationFn: async ({ id }) => {
			const { data } = await api.post(`/endorsements/${id}/cancel`);

			return data;
		},
	});

export { useEndorsements, useEndorsementCancel };

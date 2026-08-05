import type { ResponseDefault, SafeRegister } from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useSafesUpdate = (id?: string) =>
	useMutation<ResponseDefault, Error, SafeRegister>({
		mutationKey: ['safes', id, 'update'],
		mutationFn: async (props) =>
			(await api.patch<ResponseDefault>(`/safes/${id}`, props)).data,
	});

export { useSafesUpdate };

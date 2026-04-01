import type { ResponseDefault, SafeRegister } from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useSafesRegister = () =>
	useMutation<ResponseDefault, Error, SafeRegister>({
		mutationKey: ['safes', 'register'],
		mutationFn: async (props) =>
			(await api.post<ResponseDefault>('/safes', props)).data,
	});

export { useSafesRegister };

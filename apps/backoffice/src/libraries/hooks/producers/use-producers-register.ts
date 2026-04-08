import type { ProducerRegister, ResponseDefault } from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useProducersRegister = () =>
	useMutation<ResponseDefault, Error, ProducerRegister>({
		mutationKey: ['producers', 'register'],
		mutationFn: async (props) =>
			(await api.post<ResponseDefault>('/producers', props)).data,
	});

export { useProducersRegister };

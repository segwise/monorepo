import type { ResponseDefault, SafeRegister } from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import { XiorError } from 'xior';
import { api } from '@/libraries/api';

const useSafesRegister = () =>
	useMutation<ResponseDefault, Error, SafeRegister>({
		mutationKey: ['safes', 'register'],
		mutationFn: async (props) => {
			try {
				const { data } = await api.post<ResponseDefault>('/safes', props);

				return data;
			} catch (error) {
				let message = 'Falha ao fazer cadastro';

				if (error instanceof XiorError) {
					message = error.response?.data.message;
				}

				throw new Error(message);
			}
		},
	});

export { useSafesRegister };

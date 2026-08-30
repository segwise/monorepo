import type { ResponseDefault, SafeRegister } from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import { XiorError } from 'xior';
import { api } from '@/libraries/api';

const useSafesUpdate = (id?: string) =>
	useMutation<ResponseDefault, Error, SafeRegister>({
		mutationKey: ['safes', id, 'update'],
		mutationFn: async (props) => {
			try {
				const { data } = await api.patch<ResponseDefault>(
					`/safes/${id}`,
					props,
				);

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

export { useSafesUpdate };

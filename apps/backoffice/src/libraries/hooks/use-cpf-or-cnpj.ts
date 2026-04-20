import { maskNumber } from '@segwise/core/masks';
import type { Document } from '@segwise/core/types';
import { isCNPJ, isCPF } from '@segwise/core/valids';
import { useQuery } from '@tanstack/react-query';
import { parseISO } from 'date-fns';
import { api } from '@/libraries/api';

const useCpfOrCnpj = (document: string = '') =>
	useQuery({
		queryKey: ['cpf-or-cnpj', document],
		queryFn: async ({ signal }) => {
			const response = (
				await api.get<
					Omit<Document, 'birth'> & {
						birth: string;
					}
				>(`/cpf-or-cnpj/${maskNumber(document)}`, {
					signal,
				})
			).data;

			const birth = parseISO(response.birth);

			return {
				...response,
				birth: new Date(birth.getTime() + birth.getTimezoneOffset() * 60000),
			};
		},
		enabled: isCPF(document) || isCNPJ(document),
		retry: false,
	});

export { useCpfOrCnpj };

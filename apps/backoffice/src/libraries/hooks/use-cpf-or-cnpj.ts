import { maskNumber } from '@segwise/core/masks';
import type { Document } from '@segwise/core/types';
import { isCNPJ, isCPF } from '@segwise/core/valids';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useCpfOrCnpj = (document: string = '') =>
	useQuery({
		queryKey: ['cpf-or-cnpj', document],
		queryFn: async ({ signal }) =>
			(
				await api.get<Document>(`/cpf-or-cnpj/${maskNumber(document)}`, {
					signal,
				})
			).data,
		enabled: isCPF(document) || isCNPJ(document),
		retry: false,
	});

export { useCpfOrCnpj };

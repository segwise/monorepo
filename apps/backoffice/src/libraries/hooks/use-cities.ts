import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

// Municípios por UF. Quem consulta o IBGE (e guarda no Redis por 30 dias) é o
// backend; aqui só ficam em memória durante a sessão.
const useCities = (uf?: string | null) =>
	useQuery({
		queryKey: ['utils', 'cities', uf],
		queryFn: async ({ signal }) =>
			(
				await api.get<Array<string>>('/utils/cities', {
					params: { uf },
					signal,
				})
			).data,
		enabled: !!uf,
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
		retry: 1,
	});

export { useCities };

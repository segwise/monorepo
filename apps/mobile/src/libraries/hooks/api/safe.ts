import { fetchApi } from '@/functions/api';
import { useQuery } from '@tanstack/react-query';
import type { XiorError } from 'xior';

const useSafes = () =>
	useQuery<Awaited<ReturnType<typeof fetchApi.safes.listining>>, XiorError>({
		queryKey: ['safes'],
		queryFn: fetchApi.safes.listining,
	});

export { useSafes };

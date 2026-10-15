import type {
	ResponseDataCursor,
	SafeRegistration,
	SafeSimple,
} from '@segwise/core/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { XiorError } from 'xior';
import { fetchApi } from '@/functions/api';

const useSafes = () =>
	useQuery<Awaited<ReturnType<typeof fetchApi.safes.listining>>, XiorError>({
		queryKey: ['safes'],
		queryFn: fetchApi.safes.listining,
	});

const useSafesRegistration = () =>
	useMutation<ResponseDataCursor<SafeSimple>, Error, SafeRegistration>({
		mutationKey: ['safes', 'registration'],
		mutationFn: fetchApi.safes.registration,
	});

export { useSafes, useSafesRegistration };

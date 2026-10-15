import { useQuery } from '@tanstack/react-query';
import { auth } from '@/auth';

const useSession = () =>
	useQuery<unknown, Error, typeof auth.$Infer.Session>({
		queryKey: ['auth', 'session'],
		queryFn: async ({ signal }) =>
			await auth.getSession({
				fetchOptions: {
					signal,
				},
			}),
	});

export { useSession };

import { useMutation } from '@tanstack/react-query';
import { auth } from '@/auth';

const useSignOut = () =>
	useMutation<ReturnType<typeof auth.signOut>, Error>({
		mutationKey: ['auth', 'sign-out'],
		mutationFn: async () =>
			await auth.signOut(undefined, {
				onError({ error }) {
					throw error;
				},
			}),
	});

export { useSignOut };

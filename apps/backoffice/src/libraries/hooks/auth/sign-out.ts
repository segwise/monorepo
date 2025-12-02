import { useMutation } from '@tanstack/react-query';
import { auth } from '@/auth';

const useSignOut = () =>
	useMutation<unknown, Error>({
		mutationKey: ['auth', 'sign-out'],
		mutationFn: async () => await auth.signOut(),
	});

export { useSignOut };

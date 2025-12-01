import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { auth } from '@/auth';

const useSignOut = () => {
	const router = useRouter();

	return useMutation<unknown, Error>({
		mutationKey: ['auth', 'sign-out'],
		mutationFn: async () => await auth.signOut(),
		onSuccess() {
			router.push('/');
		},
		onError() {
			throw new Error('Falha ao fazer login');
		},
	});
};

export { useSignOut };

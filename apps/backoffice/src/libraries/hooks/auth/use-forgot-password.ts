import { useMutation } from '@tanstack/react-query';
import type { ForgotPassword } from '@/@types/auth/forgot-password';
import { auth } from '@/auth';

const useForgotPassword = () =>
	useMutation<unknown, Error, ForgotPassword>({
		mutationKey: ['auth', 'forgot-password'],
		mutationFn: async ({ email }) =>
			await auth.requestPasswordReset(
				{
					email,
				},
				{
					onError() {
						throw new Error('Falha ao enviar recuperação de senha');
					},
				},
			),
	});

export { useForgotPassword };

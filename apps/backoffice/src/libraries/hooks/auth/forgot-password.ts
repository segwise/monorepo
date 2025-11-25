import { useMutation } from '@tanstack/react-query';
import type { ForgotPassword } from '@/@types/auth/forgot-password';
import { requestPasswordReset } from '@/auth';

const useForgotPassword = () =>
	useMutation<unknown, Error, ForgotPassword>({
		mutationKey: ['auth', 'forgot-password'],
		mutationFn: async ({ email }) =>
			await requestPasswordReset(
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

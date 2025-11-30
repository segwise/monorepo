import { BASE_ERROR_CODES } from '@better-auth/core/error';
import { useMutation } from '@tanstack/react-query';
import type { SignIn } from '@/@types/auth/sign-in';
import { auth } from '@/auth';

const useSignIn = () =>
	useMutation<unknown, Error, SignIn>({
		mutationKey: ['auth', 'sign-in'],
		mutationFn: async ({ email, password, remember_password }) =>
			await auth.signIn.email(
				{
					email,
					password,
					rememberMe: remember_password,
				},
				{
					onError(ctx) {
						if (
							ctx.error.message?.toLowerCase() ===
								BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD.toLowerCase() ||
							ctx.error.message?.toLowerCase() ===
								BASE_ERROR_CODES.INVALID_EMAIL.toLowerCase() ||
							ctx.error.message?.toLowerCase() ===
								BASE_ERROR_CODES.INVALID_PASSWORD.toLowerCase()
						) {
							throw new Error('Credenciais de login inválidas');
						}

						if (
							ctx.error.message?.toLowerCase() ===
							BASE_ERROR_CODES.EMAIL_NOT_VERIFIED.toLowerCase()
						) {
							throw new Error('E-mail não verificado');
						}

						throw new Error('Falha ao fazer login');
					},
				},
			),
	});

export { useSignIn };

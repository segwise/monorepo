import { useMutation } from '@tanstack/react-query';
import type { BetterFetchError } from 'better-auth/client';
import type { SignIn } from '@/@types/auth/sign-in';
import { auth } from '@/auth';

const useSignIn = () =>
	useMutation<unknown, BetterFetchError, SignIn>({
		mutationKey: ['auth', 'sign-in'],
		mutationFn: async ({ email, password, rememberPassword }) =>
			await auth.signIn.email(
				{
					email,
					password,
					rememberMe: rememberPassword,
				},
				{
					onError({ error }) {
						if (error.message.toLowerCase() === 'invalid email or password') {
							throw new Error('Email ou senha inválidos');
						}

						throw error.error;
					},
				},
			),
	});

export { useSignIn };

import { useMutation } from '@tanstack/react-query';
import type { BetterFetchError } from 'better-auth/client';
import type { SignIn } from '@/@types/auth/sign-in';
import { auth } from '@/auth';

const useSignIn = () =>
	useMutation<unknown, BetterFetchError, SignIn>({
		mutationKey: ['auth', 'sign-in'],
		mutationFn: async ({ email, password }) =>
			await auth.signIn.email(
				{
					email,
					password,
				},
				{
					onError({ error }) {
						throw error;
					},
				},
			),
	});

export { useSignIn };

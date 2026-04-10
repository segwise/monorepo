import { useMutation } from '@tanstack/react-query';
import type { BetterFetchError } from 'better-auth/client';
import { XiorError } from 'xior';
import type { AcceptInvitation } from '@/@types/auth/accept-invitation';
import { api } from '@/libraries/api';

const useAcceptInvitation = () =>
	useMutation<
		unknown,
		BetterFetchError,
		Omit<AcceptInvitation, 'passwordConfirm'>
	>({
		mutationKey: ['auth', 'accept-invitation'],
		mutationFn: async ({ token, password }) => {
			try {
				return (
					await api.post('/accept-invitation', {
						token,
						password,
					})
				).data;
			} catch (error) {
				if (error instanceof XiorError) {
					throw new Error(
						error.response?.data.message || 'Falha ao aceitar convite',
					);
				}

				throw error;
			}
		},
	});

export { useAcceptInvitation };

import type {
	ResponseDefault,
	UserList,
	UserRegister,
	UserUpdate,
} from '@segwise/core/types';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { XiorError } from 'xior';
import { api } from '@/libraries/api';

function toError(error: unknown, fallback: string) {
	if (error instanceof XiorError && error.response?.data?.message) {
		return new Error(error.response.data.message);
	}

	return new Error(fallback);
}

// Qualquer mudança em usuário refaz a lista inteira (a tela mostra membros e
// convites pendentes juntos).
const invalidate = (client: {
	invalidateQueries: (o: { queryKey: Array<string> }) => Promise<void>;
}) => client.invalidateQueries({ queryKey: ['users'] });

const useUsers = (search?: string | null) =>
	useQuery({
		queryKey: ['users', 'list', { search: search || null }],
		placeholderData: keepPreviousData,
		queryFn: async ({ signal }) =>
			(
				await api.get<UserList>('/users', {
					params: { ...(search && { search }) },
					signal,
				})
			).data,
		retry: false,
	});

const useUsersRegister = () =>
	useMutation<ResponseDefault, Error, UserRegister>({
		mutationKey: ['users', 'register'],
		mutationFn: async (props) => {
			try {
				return (await api.post<ResponseDefault>('/users', props)).data;
			} catch (error) {
				throw toError(error, 'Falha ao cadastrar usuário');
			}
		},
		async onSuccess(_data, _variables, _result, ctx) {
			await invalidate(ctx.client);
		},
	});

const useUsersUpdate = (id: string) =>
	useMutation<ResponseDefault, Error, UserUpdate>({
		mutationKey: ['users', 'update', id],
		mutationFn: async (props) => {
			try {
				return (await api.patch<ResponseDefault>(`/users/${id}`, props)).data;
			} catch (error) {
				throw toError(error, 'Falha ao atualizar usuário');
			}
		},
		async onSuccess(_data, _variables, _result, ctx) {
			await invalidate(ctx.client);
		},
	});

const useUsersStatus = (id: string) =>
	useMutation<ResponseDefault, Error, 'active' | 'suspended'>({
		mutationKey: ['users', 'status', id],
		mutationFn: async (status) => {
			try {
				return (
					await api.patch<ResponseDefault>(`/users/${id}/status`, { status })
				).data;
			} catch (error) {
				throw toError(error, 'Falha ao alterar o acesso');
			}
		},
		async onSuccess(_data, _variables, _result, ctx) {
			await invalidate(ctx.client);
		},
	});

const useUsersDelete = (id: string) =>
	useMutation<ResponseDefault, Error>({
		mutationKey: ['users', 'delete', id],
		mutationFn: async () => {
			try {
				return (await api.delete<ResponseDefault>(`/users/${id}`)).data;
			} catch (error) {
				throw toError(error, 'Falha ao excluir usuário');
			}
		},
		async onSuccess(_data, _variables, _result, ctx) {
			await invalidate(ctx.client);
		},
	});

const useUsersInvitationResend = (id: string) =>
	useMutation<ResponseDefault, Error>({
		mutationKey: ['users', 'invitation', 'resend', id],
		mutationFn: async () => {
			try {
				return (
					await api.post<ResponseDefault>(`/users/invitations/${id}/resend`)
				).data;
			} catch (error) {
				throw toError(error, 'Falha ao reenviar convite');
			}
		},
		async onSuccess(_data, _variables, _result, ctx) {
			await invalidate(ctx.client);
		},
	});

const useUsersInvitationDelete = (id: string) =>
	useMutation<ResponseDefault, Error>({
		mutationKey: ['users', 'invitation', 'delete', id],
		mutationFn: async () => {
			try {
				return (await api.delete<ResponseDefault>(`/users/invitations/${id}`))
					.data;
			} catch (error) {
				throw toError(error, 'Falha ao excluir convite');
			}
		},
		async onSuccess(_data, _variables, _result, ctx) {
			await invalidate(ctx.client);
		},
	});

export {
	useUsers,
	useUsersDelete,
	useUsersInvitationDelete,
	useUsersInvitationResend,
	useUsersRegister,
	useUsersStatus,
	useUsersUpdate,
};

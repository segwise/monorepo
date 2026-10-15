import { useMutation } from '@tanstack/react-query';
import { auth } from '@/auth';

type Input = {
	currentPassword: string;
	newPassword: string;
	revokeOtherSessions: boolean;
};

// Traduz o erro do better-auth para a mensagem mostrada ao usuário.
function toMessage(error: { code?: string; status?: number }) {
	// O servidor responde 401 também para senha atual errada: o código decide.
	if (
		error.code === 'INVALID_PASSWORD' ||
		error.code === 'INVALID_EMAIL_OR_PASSWORD'
	) {
		return 'Senha atual incorreta';
	}

	if (error.status === 429) {
		return 'Muitas tentativas. Aguarde um instante e tente de novo';
	}

	if (error.status === 401) {
		return 'Sessão expirada. Entre novamente';
	}

	return 'Falha ao alterar a senha';
}

const useChangePassword = () =>
	useMutation<unknown, Error, Input>({
		mutationKey: ['auth', 'change-password'],
		mutationFn: async (props) =>
			await auth.changePassword(props, {
				onError({ error }) {
					throw new Error(toMessage(error));
				},
			}),
	});

export { useChangePassword };

import { canAccessUsers, type StaffRole } from '@segwise/core';
import type { Context } from '@/@types/server';

type UsersActor = {
	brokerId: string;
	userId: string;
	role: StaffRole;
};

// Quem opera a tela de usuários: precisa estar logado numa corretora com um
// papel que acesse a equipe (dono, admin ou gerente). Qualquer outra coisa é
// recusada antes de tocar no banco.
function getUsersActor(ctx: Pick<Context, 'session'>): UsersActor | null {
	const { brokerId, brokerRole, userId } = ctx.session ?? {};

	if (!brokerId || !userId || !canAccessUsers(brokerRole)) {
		return null;
	}

	return { brokerId, userId, role: brokerRole as StaffRole };
}

export { getUsersActor, type UsersActor };

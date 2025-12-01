import { auth } from '@/services/auth';
import { database } from '@/services/database';

const INIT = {
	name: 'Administrador Master',
	email: 'admin@segwise.com.br',
	password: 'Segwise123!',
};

async function seed() {
	await database.$transaction(async (transaction) => {
		const isInit = await transaction.user.findUnique({
			where: {
				email: INIT.email,
			},
			select: {
				id: true,
			},
		});

		if (isInit) {
			return;
		}

		await auth.api.createUser({
			body: {
				name: INIT.name,
				email: INIT.email,
				password: INIT.password,
				role: 'admin',
				data: {
					emailVerified: true,
				},
			},
		});
	});
}

await seed().finally(() => database.$disconnect());

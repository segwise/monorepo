import { auth } from '@/services/auth';
import { database } from '@/services/database';

const INIT = {
	name: 'Administrador Master',
	email: 'admin@segwise.com.br',
	password: 'Segwise123!',
};

async function seed() {
	try {
		const isInit = await database.user.findUnique({
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

		await database.$transaction(async (_transaction) => {
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
	} catch (error) {
		console.error(error);
	}
}

await seed().finally(() => database.$disconnect());

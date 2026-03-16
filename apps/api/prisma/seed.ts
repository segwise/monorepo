import { generateReferral } from 'functions/generate-referral';
import { Role } from '@/generated/prisma/enums';
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

		await auth.api.createUser({
			body: {
				name: INIT.name,
				email: INIT.email,
				password: INIT.password,
				role: Role.admin,
				data: {
					emailVerified: true,
					referral: generateReferral(),
				},
			},
		});

		await database.insuranceCompany.create({
			data: {
				name: 'porto seguro',
				icon: '',
			},
		});
	} catch (error) {
		console.error(error);
	}
}

await seed().finally(() => database.$disconnect());

import xior from 'xior';
import { Role } from '@/generated/prisma/enums';
import { auth } from '@/services/auth';
import { database } from '@/services/database';
import { storage } from '@/services/storage/images';

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
					// referral: generateReferral(),
					referral: 'admin123',
				},
			},
		});

		const idInsurance = Bun.randomUUIDv7();

		const pathInsurance = `/insurance-companies/${idInsurance}`;

		const { data } = await xior.get(
			'https://play-lh.googleusercontent.com/9AXivDxUm2lyogDCW9BIe5E3sMm_jqT6T_kCTJQxZ5A6AXI1dfjOwfpu-p6jH_i9ja4',
			{
				responseType: 'blob',
			},
		);

		await storage.write(pathInsurance, data);

		await database.insuranceCompany.create({
			data: {
				id: idInsurance,
				name: 'porto seguro',
				icon: pathInsurance,
				cnpj: '61198164000160',
				contacts: {
					create: {
						index: 0,
						label: 'Guincho 24 horas',
						contacts: {
							createMany: {
								data: [
									{
										index: 0,
										coverage: 'all_regions',
										isWhatsapp: true,
										value: '81996473649',
									},
									{
										index: 1,
										coverage: 'capitals_and_metropolitan_regions',
										value: '3440404040',
									},
								],
								skipDuplicates: true,
							},
						},
					},
				},
			},
		});
	} catch (error) {
		console.error(error);
	}
}

await seed().finally(() => database.$disconnect());

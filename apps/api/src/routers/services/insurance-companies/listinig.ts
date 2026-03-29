import type { Server } from '@/@types/server.d';
import { selectPrisma as selectPrismaSimple } from '@/libraries/database/adapters/insurance-company/simple';
import { serializer as serializerSimple } from '@/libraries/database/serializers/insurance-company/simple';

function registerRoutersServicesInsuranceCompaniesListining(server: Server) {
	server.get('/simple', async (ctx) => {
		const insuranceCompanies = await ctx.database.insuranceCompany.findMany({
			select: selectPrismaSimple,
			relationLoadStrategy: 'join',
			orderBy: {
				name: 'asc',
			},
		});

		const data = insuranceCompanies.map((props) =>
			serializerSimple(props, {
				storage: ctx.storage.images,
			}),
		);

		return ctx.json(data, 200);
	});
}

export { registerRoutersServicesInsuranceCompaniesListining };
